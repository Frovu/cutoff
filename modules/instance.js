
const fs = require('fs-extra');
const uuid = require('uuid/v4');
const path = require('path');
const { spawn } = require('child_process');

const config = global.config, log = global.log, query = global.query;
let instances = {};
let running = {};
// create instances directory if not exists
if(!fs.existsSync(config.instancesDir))
	fs.mkdirSync(config.instancesDir);
else // clear lost instances
	fs.readdir(path.join(config.instancesDir), async(err, files) => {
		const result = await query('select id from instances');
		const stored = result.map(i => i.id); let i=0;
		for(const f of files) {
			if(!stored.includes(f)) {
				fs.removeSync(path.join(config.instancesDir, f));
				++i;
			}
		}
		log(`Removed ${i} unowned instances`);
	});

/*setInterval(() =>
	Object.keys(instances).forEach(el => {
		if(Date.now() - instances[el].spawnedAt >= config.timeToLive) {
				fs.removeSync(path.join(config.instancesDir, el));
				delete instances[el];
				log('Instance rotted away from storage: '+el);
		}
	}, config.time / 4));*/

const iniOrder = ['kp', 'swdp', 'dst', 'imfBy', 'imfBz', 'g1', 'g2', 'g3',
	'model', 'alt', 'lat', 'lon', 'vertical', 'azimutal', 'lower', 'upper', 'step', 'flightTime'];

function serializeIni(ini, trace, cones=false) {
	// parse datetime
	const d = new Date(ini.datetime);
	const date = `${d.getDate()>9?'':0}${d.getDate()}.${d.getMonth()>8?'':0}${d.getMonth()+1}.${d.getFullYear()}`;
	const time = d.toISOString().split('T')[1].replace(/\..*/, '');
	let text = `\n${date}\n${time}`;
	if (cones) { // TODO: choose coordinate system (GEO [0], GSE [1] or GSM [2])
		text += `\n${iniOrder.slice(0, -8).map(i => ini[i]).join('\n')}
0\n-180. 180.\n#\n${iniOrder.slice(-8, -4).map(i => ini[i]).join(' ')} =\n#`;
	} else {
		text += `\n${iniOrder.slice(0, -4).map(i => ini[i]).join('\n')}
${trace||(ini.lower!=0?ini.lower:ini.step)}
${trace||ini.upper}
${ini.step}\n${ini.flightTime}\n${trace?1:0}`;
	}
	return text;
}

function spawnCutoff(id, trace, onExit) {
	const ini = instances[id].settings;
	const initxt = serializeIni(ini, trace);
	fs.writeFileSync(path.join(config.instancesDir, id, config.iniFilename), initxt);
	const cutoff = spawn('wine', [path.join(process.cwd(), config.execName)],
		{cwd: path.join(process.cwd(), config.instancesDir, id)});
	cutoff.on('exit', (code, signal)=>{
		delete running[id];
		onExit(code, signal);
	});
	return running[id] = {
		type: trace?'trace':'instance',
		spawned: new Date(),
		linesPredict: trace?undefined:(ini.upper-ini.lower)/ini.step*2, // for percentage count
		linesGot: trace?undefined:0,
		tracesCalculating: trace?undefined:0,
		cutoff: cutoff
	};
}

async function runCones(id) {
	const start = new Date();
	const instance = instances[id];
	const rigidities = [999, 100, 50, 30, 40, 20, 10]; // FIXME
	const settings = serializeIni(instance.settings, false, true) + '\n' + rigidities.join('\n');
	fs.writeFileSync(path.join(config.instancesDir, id, config.iniCones), settings);
	const cones = spawn('wine', [path.join(process.cwd(), config.execCones)],
		{cwd: path.join(process.cwd(), config.instancesDir, id)});
	return new Promise(resolve => {
		cones.on('exit', (code, signal) => {
			log(`cones code=${code} sg=${signal} took ${(Date.now()-start)/1000} seconds`);
			resolve(code === 0 ? 'ok' : 'failed');
		});
	});
}

module.exports.spawnCutoff = spawnCutoff;
module.exports.create = function newInstance(ini, user, callback) {
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
			created: new Date(),
			owner: user,
			settings: ini,
			name: ini.name
		};
		let instance = spawnCutoff(id, null, async(code, signal) => {
			delete running[id];
			log(`cutoff code=${code} sg=${signal} took ${(Date.now()-instance.spawned)/1000} seconds`);
			if(code === null) {
				return; // process killed by signal
			} else if(code === 0) {
				instances[id].completed = new Date();
				instances[id].status = 'completed';
				// rename .dat file so it won't be overwritten by trace calculation
				fs.renameSync(path.join(dir, config.datFilename), path.join(dir, 'data.dat'));

				// const data = module.exports.data(id); // must be ran before cones
				const conesStatus = await runCones(id);
				instances[id].cones = conesStatus;
				// save instance in db
				const owner = instances[id].owner;
				if(owner) {
					try {
						let vals = [id, owner, instances[id].created.getTime(),
							Date.now(), instances[id].settings.datetime].concat(
							Object.values(instances[id].settings).slice(1));
						if(ini.name)
							vals.push(ini.name);
						const q = `insert into instances(id, owner, created, completed, datetime,
${iniOrder.join()}${ini.name?',name':''}) values(?,?${',FROM_UNIXTIME(?/1000)'.repeat(3)+',?'.repeat(iniOrder.length+(ini.name?1:0))});`;
						await query(q, vals);
					} catch(e) {
						log(e);
						return false;
					}
				}
				delete instances[id].settings.name;
			} else {
				instances[id].status = 'failed';
				instances[id].completed = new Date();
			}
		});
		log(`Spawned instance of owner (${user}): ${id}`);
		instance.cutoff.stdout.on('data', () => {
			instance.linesGot++;
		});
		callback(id);
	});
};

module.exports.getOwned = async function(user) {
	let list = [];
	const result = await query('select * from instances where owner=?', [user]);
	// append running instances
	for(const id in instances) {
		if(instances[id].owner == user && instances[id].status == 'processing')
			list.push({id: id, name: instances[id].name, settings: instances[id].settings, created: instances[id].created});
	}
	for(const i of result) {
		delete i.owner;
		const a = {};
		a.settings = {};
		for(const p in i) {
			if(iniOrder.includes(p) || p == 'datetime')
				a.settings[p] = i[p];
			else
				a[p] = i[p];
		}
		list.push(a);
	}
	return list;
};

// cache instance if not cached since this is callen before any other action
module.exports.exist = async function(id) {
	if (id in instances)
		return true;
	try {
		if(!fs.existsSync(config.instancesDir, id)) return false;
		const result = await query('select * from instances where id=?', [id]);
		if(result.length > 0) {
			instances[id] = {
				created: new Date(result[0].created),
				completed: new Date(result[0].completed),
				owner: result[0].owner,
				status: 'completed'
			};
			instances[id].settings = {datetime: result[0].datetime};
			for(const i of iniOrder)
				instances[id].settings[i] = result[0][i];
			log(`Restored instance: ${id}`);
		} else {
			delete instances[id];
		}
		return result.length > 0;
	} catch(e) {
		log(e);
		return false;
	}
};

module.exports.data = function(id) {
	if (instances[id].data)
		return instances[id].data;
	instances[id].data = {};
	try {
		const text = fs.readFileSync(path.join(config.instancesDir, id, 'data.dat'));
		// на первый взгляд спагетти, но если знать формат, то нормально
		let arr = text.toString().split(/\r?\n/);
		let arr_ = arr.splice(0, arr.indexOf('Cutoff rigidities:'));
		instances[id].data.particles = arr_.map(el => el.trim().split(/\s+/).map(e => Number(e)));
		arr = arr.slice(1, 4).map(el => Number(el.trim().split(/\s+/)[1]));
		instances[id].data.lower = arr[0];
		instances[id].data.upper = arr[1];
		instances[id].data.effective = arr[2];
	} catch(e) {
		return instances[id].data = null;
	}
	try {
		const text = fs.readFileSync(path.join(config.instancesDir, id, config.datCones));
		const lines = text.toString().split(/\r?\n/).slice(1, -1);
		instances[id].data.cones = lines.map(l => {
			const sp = l.split(/\s\s+/);
			const rig = Number(sp[0]);
			if (l.indexOf(',') > 0) return [rig, null, null];
			return [rig, Number(sp[1]), Number(sp[2])];
		});
	} catch(e) { console.log(e); }
	return instances[id].data;
};

module.exports.available = function(id) {
	return id ? !running[id] : Object.keys(running).length < config.maxRunningInstances;
};

module.exports.hasAccess = function(id, user, guest) {
	return guest || (instances[id].owner === user);
};

module.exports.get = function(id) {
	const obj = Object.assign({}, instances[id]);
	delete obj.owner;
	return obj;
};

module.exports.percentage = function(id) {
	return running[id].linesGot / running[id].linesPredict * 100;
};

const trace = require('./trace.js');
module.exports.trace = function(id, energy, callback) {
	trace(id, energy, callback);
};

module.exports.setName = async function(id, name) {
	try {
		await query('update instances set name=? where id=?', [name, id]);
	} catch (e) {
		return false;
	}
	return true;
};

module.exports.kill = async function(id) {
	delete instances[id];
	try {
		fs.removeSync(path.join(config.instancesDir, id));
	} catch(e) {
		log(e);
	}
	await query('delete from instances where id=?', [id]);
	const toKill = running[id];
	if(toKill)
		toKill.cutoff.kill('SIGHUP');
	log(`Deleted instance: ${id}`);
};
