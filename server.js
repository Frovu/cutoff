const express = require('express');
const uuid = require('uuid/v4');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

const settings = {
	port: 3050,
	timeToLive: 3600000,
	maxRunningInstances: 3,
	instancesDir: './cutoff/',
	execName: 'Cutoff2050.exe',
	iniFilename: 'CutOff.ini',
	valueRanges: './valueranges.json'
}

// logging
let logStream = fs.createWriteStream('./log.log', {flags:'a'});
function log(msg) {
	console.log(msg);
	logStream.write(`[${new Date().toISOString().replace(/\..+/g, "")}] ${msg}\n`);
}
process.on('unhandledRejection', error => {
  log(error.stack);
});

const ranges = require(settings.valueRanges);

if(!fs.existsSync(settings.instancesDir)) {
	fs.mkdirSync(settings.instancesDir);
}

// delete outdated data
try{
	fs.readdir(settings.instancesDir, (err, files) => {
	    for(f of files) {
			fs.removeSync(path.join(settings.instancesDir, f));
	    }
	});
} catch(e) {log('failed to delete something');}

const app = express();
app.use(express.json());
app.use(require('compression')({ level: 9 }));

let instances = {}; //
instances.running = 0; // active instances count

//
setInterval(() =>
	Object.keys(instances).forEach(el => {
		if(Date.now() - instances[el].spawnedAt >= settings.timeToLive) {
				fs.removeSync(path.join(settings.instancesDir, el));
				delete instances[el];
				log('instance rotted: '+el);
		}
	}, settings.time / 4));

// TODO: remove on production
app.use(express.static('./front/'));

function assertIni(ini) {
	// check value ranges
	for(param of Object.keys(ranges)) {
		if(typeof ini[param] === 'undefined') { // parameter was not specified
			// fail if param is needed for every model or for current model
			if((typeof ranges[param]["for"] === 'undefined') ||
			 		(ranges[param]["for"].includes(ini["model"])) )
				return false;
		}
		if(typeof ranges[param]["range"] !== 'undefined') {
			if(!ranges[param]["range"].includes(ini[param]))
				return false;
		}
		else
			if(ini[param] > ranges[param]["max"] || ini[param] < ranges[param]["min"])
				return false;
		// round of needed
		if(ranges[param]["int"] === true) {
			ini[param] = Math.trunc(ini[param]);
		}
	}
	// additional checks
	if(ini["lower"] >= ini["upper"])
		return false;

	// all checks passed
	return true;
}

function createInstance(ini, id, callback) {
	let dir = path.join(settings.instancesDir, id);
	let iniString = `\n${ini.date}\n${ini.time}\n${ini.swdp}\n${ini.dst}\n${ini.imfBy}\n${ini.imfBz}
${ini.g1}\n${ini.g2}\n${ini.kp}\n${ini.model}\n${ini.alt}\n${ini.lat}\n${ini.lon}\n${ini.vertical}
${ini.azimutal}\n${ini.lower}\n${ini.upper}\n${ini.step}\n${ini.flightTime}\n${ini.trace}`; // )))0)

	// create instance directory
	fs.mkdir(dir, (err) => {
		if(err) {
			log(err);
			callback(false);
		}
		fs.writeFile(path.join(dir, settings.iniFilename), iniString, (err) => {
			if(err) {
				log(err);
				callback(false);
			}
			// spawn process
			let cutoff = spawn('wine', [path.join(__dirname, settings.execName)], { cwd: dir })
			let instance = instances[id] = {
				status: 'processing',
				spawnedAt: new Date(),
				linesPredict: (ini["upper"]-ini["lower"])/ini["step"]*2, // for percentage count
				linesGot: 0,
				process: cutoff
			};
			log('instance spawned:'+id);
			instances.running++;
			//log('running = '+instances.running)

			cutoff.on('error', e => {
				log(e);
			});

			cutoff.stdout.on('data', data => {
				instance.linesGot++;
			});

			cutoff.on('exit', (code, signal) => {
				instances.running--;
				//log('running = '+instances.running)
				log(`cutoff code=${code} sg=${signal} took ${(Date.now()-instances[id].spawnedAt)/1000} seconds`)
				if(code === null) {
					// process killed by signal
					delete instances[id];
					try{fs.removeSync(path.join(settings.instancesDir, id));}
					catch(e){log(e);}
				} else if(code === 0) {
					instance.status = 'complete';
					instance.completeAt = Date.now();
				} else {
					//
					// FIXME: remove instance ()
					//
					instance.status = 'failed';
					instance.completeAt = Date.now();
				}
			});

			callback(true);
		});
	});
};

// client spawns instance
app.post('/submit', (req, res) => {
	if(!assertIni(req.body)) {
		return res.status(400).send('bad settings');
	}
	else {
		if(instances.running >= settings.maxRunningInstances)
			return res.status(503).send('busy');
		const id = uuid();
		createInstance(req.body, id, (ok) => {
			if(ok)
				res.status(200).send(id);
			else
				res.status(500).send('failed');
		});
	}
});

// request instance status
app.get('/:uuid/status', (req, res) => {
	const id = req.params.uuid;
	if (typeof instances[id] === 'undefined')
		res.sendStatus(404);
	else
		res.status(200).send({ status: instances[id].status,
			 percentage: (instances[id].linesGot / instances[id].linesPredict * 100) });
});

// request calculation result
app.get('/:uuid/dat', (req, res) => {
	const id = req.params.uuid
	if (typeof instances[id] === 'undefined')
		res.sendStatus(404)
	else if (instances[id].status === 'complete'){
		fs.readFile(path.join(settings.instancesDir, id, 'Cutoff.dat'), (err, data) => {
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
	}
	else // processing
		res.sendStatus(102)
});

// request trace data
app.get('/:uuid/:trace', (req, res) => {
	const id = req.params.uuid
	if (typeof instances[id] === 'undefined')
		res.sendStatus(404)
	else if (instances[id].status === 'complete') {
		fs.readdir(path.join(settings.instancesDir, id), (err, files) => {
			if (err) {
				res.status(500).send({ err })
			} else {
				const tracefile = files.filter(el => /^Trace\d{5}\.dat$/.test(el)).sort()[req.params.trace];//-1]),
				if(!tracefile)
					res.status(400).send('Invalid trace');
				else
				fs.readFile(path.join(settings.instancesDir, id, tracefile),
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
});

// kill running process
app.post('/:uuid/kill', (req, res) => {
	const id = req.params.uuid
	if (typeof instances[id] === 'undefined')
		res.sendStatus(404)
	else if (instances[id].status === 'processing') {
		// kill process
		instances[id].process.kill('SIGHUP');
		log(`Process killed from front.`)
		res.status(200).send(id)
	}
	else res.sendStatus(402)
});

// start server
app.listen(settings.port, () =>
	log(`Server is started on port ${ settings.port }...`));
