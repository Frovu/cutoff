const express = require('express')
const uuid = require('uuid/v4')
const fs = require('fs-extra')
const path = require('path')
const meow = require('meow')
//const scanf = require('scanf')
//const cors = require('cors')
const { spawn } = require('child_process')

/*function marshallIni(settings) {
	return `\n01.07.2017\n00:00:00\n0.5\n-30.0\n-7.8\n-2.9\n1.8\n7.0\n1.99\n00\n20.00\n67.55\n33.33\n0.00\n0.00\n0.00\n2.00\n0.01\n180.00\n1`
}*/

let logStream = fs.createWriteStream('./log.log', {flags:'a'});
function log(msg){
	console.log(msg)
	logStream.write(`[${new Date().toISOString().replace(/\..+/g, "")}] ${msg}\n`)
}

const args = meow({
	help: `
Options:
	--port, -p 					  application port
		default: 3050
	--time, -t 		        time of life of cutoff instance after calculation in seconds
		default: 28800
	--directory, -d 		  path to directory of cutoff instances
		default: ./cutoff/
	--command, -c 				command to run CutOff
		default: ./Cutoff2050.exe
`,
	flags: {
		port: {
			type: 'string',
			default: '3050',
			alias: 'p'
		},
		time: {
			type: 'string',
			default: '28800',
			alias: 't'
		},
		directory: {
			type: 'string',
			default: './cutoff/',
			alias: 'd'
		},
		command: {
			type: 'string',
			default: './Cutoff2050.exe',
			alias: 'c'
		}
	}
})

args.flags.port = Number(args.flags.port)
args.flags.time = Number(args.flags.time) * 1000
try{fs.mkdir(args.flags.directory)}catch(e){}
// delete outdated data
try{fs.readdir(args.flags.directory, (err, files) => {
    for(f of files){
	fs.removeSync(path.join(args.flags.directory, f))
    }
})}catch(e){log('failed to delete something')}

const app = express()
app.use(express.json())
app.use(require('compression')({ level: 9 }))

var instances = {} //

setInterval(() =>
	Object.keys(instances).forEach(el => {
		if (typeof instances[el].timestamp !== 'undefined') {
			if ((instances[el].timestamp + args.flags.time) <= Date.now()) {
				fs.removeSync(path.join(args.flags.directory, el))
				delete instances[el]
			}
		}
	}, args.flags.time / 2))

// TODO remove on production
//app.use(express.static('./front/'))

app.post('/submit', (req, res) => {
	let id = uuid()
	let dir = path.join(args.flags.directory, id)

	fs.mkdir(dir, (err) => {
		if(err)
			log(err)
		/*{
			"date": "01.07.2017",
			"time": "00:00:00",
			"pressure": 0.5,
			"dstIndex": -30,
			"imfBy": -7.8,
			"imfBz": -2.9,
			"g1": 1.8,
			"g2": 7.0,
			"kp": 1.99,
			"model": "00",
			"height": 20,
			"latitude": 67.55,
			"longitude": 33.33,
			"verticalAngle": 0,
			"azimutalAngle": 0,
			"lower": 0,
			"upper": 2,
			"step": 0.001,
			"maxTime": 180,
			"trace": 0
		}*/

		let ini = `
${req.body.date}
${req.body.time}
${req.body.swdp}
${req.body.dst}
${req.body.imfBy}
${req.body.imfBz}
${req.body.g1}
${req.body.g2}
${req.body.kp}
${req.body.model}
${req.body.alt}
${req.body.lat}
${req.body.lon}
${req.body.vertical}
${req.body.azimutal}
${req.body.lower}
${req.body.upper}
${req.body.step}
${req.body.flightTime}
${req.body.trace}`
fs.writeFile(path.join(dir, 'CutOff.ini'), ini, err => {
	if (err) {
		res.status(500).send({ err })
		return log(err)}

	// spawn process
	let spawnedTime = new Date()
	let cutoff = spawn('wine', [path.join(__dirname, 'CutOff2050.exe')], { cwd: dir })
	//let cutoff = spawn(path.join(__dirname, 'CutOff2050.exe'), { cwd: dir })
	let instance = instances[id] = {
		status: 'processing',
		precentage: 0,
		process: cutoff  // I suppose I have autism but who cares
	}

	cutoff.on('error', e => {
		log(e)
	})
	cutoff.stdout.on('data', data => {
		for (let c of data)
			if (c === 10)
				instance.precentage++
	})

	cutoff.on('close', (code, signal) => {
		log(`Cutoff exited with code: ${code}. ${signal}\nIn ${(Date.now()-spawnedTime)/1000} seconds`)
		if (code === 0) {
			instance.status = 'complete'
			instance.timestamp = Date.now()
		} else {
			instance.status = 'failed'
			instance.timestamp = Date.now()
		}
	})

	res.status(200).send(id)
})
})
})

app.get('/:uuid/status', (req, res) => {
	const id = req.params.uuid
	if (typeof instances[id] === 'undefined')
		res.sendStatus(404)
	else
		res.send({ status: instances[id].status, precentage: instances[id].precentage })
})

app.get('/:uuid/dat', (req, res) => {
	const id = req.params.uuid
	if (typeof instances[id] === 'undefined')
		res.sendStatus(404)
	else if (instances[id].status === 'complete'){
		fs.readFile(path.join(args.flags.directory, id, 'Cutoff.dat'), (err, data) => {
			if (err) {
				log(err)
				res.status(500).send({ err })
			} else {
				let response = {}

				// на первый взгляд спагетти, но если знать формат, то нормально
				let arr = data.toString().split(/\r?\n/)
				let arr_ = arr.splice(0, arr.indexOf('Cutoff rigidities:'))
				response.particles = arr_.map(el => el.trim().split(/\s+/).map(e => Number(e)))
				arr = arr.slice(1, 4).map(el => Number(el.trim().split(/\s+/)[1]))
				response.lower = arr[0]
				response.upper = arr[1]
				response.effective = arr[2]

				log(`Completed (requested). effective: ${arr[2]}`) //

				res.send(response)
			}
		})
	} else
		res.sendStatus(102)
})

app.get('/:uuid/:trace', (req, res) => {
	const id = req.params.uuid
	if (typeof instances[id] === 'undefined')
		res.sendStatus(404)
	else if (instances[id].status === 'complete') {
		fs.readdir(path.join(args.flags.directory, id), (err, files) => {
			if (err) {
				res.status(500).send({ err })
			} else {
				fs.readFile(path.join(args.flags.directory, id,
					files.filter(el => /^Trace\d{5}\.dat$/.test(el)).sort()[req.params.trace]), //-1]),
				(err, data) => {
					if (err) {
						res.status(500).send({ err })
					} else {
						res.send(data.toString().split(/\r?\n/).slice(1)
								.map(el => el.trim().split(/\s+/).slice(0, 4).map(e => Number(e))))
					}
				})
			}
		})
	} else
		res.sendStatus(102)
})

app.post('/:uuid/kill', (req, res) => {
	const id = req.params.uuid
	if (typeof instances[id] === 'undefined')
		res.sendStatus(404)
	else if (instances[id].status === 'processing') {
		// kill process
		instances[id].process.kill('SIGHUP');
		// remove file and stuff
		delete instances[id]
		try{fs.removeSync(path.join(args.flags.directory, id))}
		catch(e){log(e)}
		log(`Process killed from front.`)
		res.status(200).send(id)
	}
	else res.sendStatus(402)
})

app.listen(args.flags.port, () =>
log(`Server is started on port ${ args.flags.port }...`))
