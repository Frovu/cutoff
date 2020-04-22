
const fs = require('fs-extra');
const uuid = require('uuid/v4');
const path = require('path');
const { spawn } = require('child_process');

const jpath = '../instance.json';
let instances = require(jpath);
let running = {};
// create instances directory if not exists
if(!fs.existsSync(config.instancesDir))
	fs.mkdirSync(config.instancesDir);

function jsonDump() {
	fs.writeFileSync(jpath, JSON.stringify(instances, null, 2), 'utf8', (err) => {
	    if(err) log(`Failed writing ${jsonPath} ${err.stack}`);
	});
}

setInterval(() =>
	Object.keys(instances).forEach(el => {
		if(Date.now() - instances[el].spawnedAt >= config.timeToLive) {
				fs.removeSync(path.join(config.instancesDir, el));
				delete instances[el];
				log('instance rotted: '+el);
		}
	}, config.time / 4));

function spawnCutoff(id, trace) {
	const ini = instances[id].ini;
	const initxt = `\n${ini.date}\n${ini.time}\n${ini.swdp}\n${ini.dst}\n${ini.imfBy}\n${ini.imfBz}
${ini.g1}\n${ini.g2}\n${ini.kp}\n${ini.model}\n${ini.alt}\n${ini.lat}\n${ini.lon}\n${ini.vertical}
${ini.azimutal}\n${trace||(parseFloat(ini.lower)!=0?ini.lower:ini.step)}\n${trace||ini.upper}\n${ini.step}\n${ini.flightTime}\n${trace?1:0}`;
	fs.writeFileSync(path.join(config.instancesDir, id, config.iniFilename), initxt);
	return running[id] = {
		type: trace?'trace':'instance',
		spawnedAt: new Date(),
		linesPredict: trace?undefined:(ini.upper-ini.lower)/ini.step*2, // for percentage count
		linesGot: trace?undefined:0,
		tracesCalculating: trace?undefined:0,
		cutoff: spawn('wine', [path.join(process.cwd(), config.execName)], {cwd: path.join(process.cwd(), config.instancesDir, id)})
	};
}

module.exports.spawnCutoff = spawnCutoff;
module.exports.create = function(ini, callback) {
	const id = uuid();
	const dir = path.join(config.instancesDir, id);
	// create instance directory
	fs.mkdir(dir, (err) => {
		if(err) {
			log(err);
			callback(false);
		}
		instances[id] = {
			status: 'processing',
			createdAt: new Date(),
			ini: ini
		};
		let instance = spawnCutoff(id);
		jsonDump();
		log(`instance spawned ${id}`);
		instance.cutoff.stdout.on('data', data => {
			instance.linesGot++;
		});
		instance.cutoff.on('exit', (code, signal) => {
			delete running[id];
			log(`cutoff code=${code} sg=${signal} took ${(Date.now()-instance.spawnedAt)/1000} seconds`)
			if(code === null) {
				return;	// process killed by signal
			} else if(code === 0) {
				instances[id].status = 'complete';
				instances[id].completeAt = Date.now();
				// save .dat file with another filename
				fs.renameSync(path.join(dir, config.datFilename), path.join(dir, 'data.dat'));
			} else {
				instances[id].status = 'failed';
				instances[id].completeAt = Date.now();
			}
			jsonDump();
		});
		callback(id);
	});
};

module.exports.data = function(id) {
	try {
		var data = fs.readFileSync(path.join(config.instancesDir, id, 'data.dat'));
	} catch(e) {
		log(e.stack);
		return null;
	}
	let response = {};
	// на первый взгляд спагетти, но если знать формат, то нормально
	let arr = data.toString().split(/\r?\n/);
	let arr_ = arr.splice(0, arr.indexOf('Cutoff rigidities:'));
	response.particles = arr_.map(el => el.trim().split(/\s+/).map(e => Number(e)));
	arr = arr.slice(1, 4).map(el => Number(el.trim().split(/\s+/)[1]));
	response.lower = arr[0];
	response.upper = arr[1];
	response.effective = arr[2];
	return response;
};

module.exports.available = function(id) {
	return id ? !running.hasOwnProperty(id) : Object.keys(running).length < config.maxRunningInstances;
};

module.exports.exist = function(id) {
	return instances.hasOwnProperty(id);
};

module.exports.status = function(id) {
	return instances[id] ? instances[id].status : null;
};

module.exports.percentage = function(id) {
	return running[id].linesGot / running[id].linesPredict * 100;
};

module.exports.kill = function(id) {
	const toKill = running[id];
	if(!toKill) return false;
	if(toKill) {
		// delete instance
		delete instances[id];
		try{fs.removeSync(path.join(config.instancesDir, id));}
		catch(e){log(e);}
	}
	toKill.cutoff.kill('SIGHUP');
}
