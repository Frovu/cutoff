
const fs = require('fs-extra');
const uuid = require('uuid/v4');
const path = require('path');
const { spawn } = require('child_process');

let instances = {};
let running = {};
// create instances directory if not exists
if(!fs.existsSync(config.instancesDir))
	fs.mkdirSync(config.instancesDir);
else // clear lost instances
	fs.readdir(path.join(config.instancesDir), async(err, files) => {
        const result = await query(`select id from instances`);
		const stored = result.map(i => i.id); let i=0;
		for(const f of files) {
			if(!stored.includes(f)) {
				fs.removeSync(path.join(config.instancesDir, f));
				++i;
			}
		}
		log(`Removed ${i} unowned instances`);;
});

/*setInterval(() =>
	Object.keys(instances).forEach(el => {
		if(Date.now() - instances[el].spawnedAt >= config.timeToLive) {
				fs.removeSync(path.join(config.instancesDir, el));
				delete instances[el];
				log('Instance rotted away from storage: '+el);
		}
	}, config.time / 4));*/

const iniOrder = ['date', 'time', 'swdp', 'dst', 'imfBy', 'imfBz', 'g1', 'g2', 'kp',
	'model', 'alt', 'lat', 'lon', 'vertical', 'azimutal', 'lower', 'upper', 'step', 'flightTime'];

function serializeIni(ini, trace) {
	console.log(ini)
	// parse datetime
	const d = new Date(ini.datetime);
	const date = `${d.getDate()>9?'':0}${d.getDate()}.${d.getMonth()>8?'':0}${d.getMonth()+1}.${d.getFullYear()}`;
	const time = d.toISOString().split('T')[1].replace(/\..*/, '');
	return  `
${date}\n${time}
${iniOrder.slice(2, -4).map(i => ini[i]).join('\n')}
${trace||(ini.lower!=0?ini.lower:ini.step)}
${trace||ini.upper}
${ini.step}\n${ini.flightTime}\n${trace?1:0}`;
}

function spawnCutoff(id, trace, onExit) {
	const ini = instances[id].settings;
	const initxt = serializeIni(ini, trace);
	fs.writeFileSync(path.join(config.instancesDir, id, config.iniFilename), initxt);
	const cutoff = spawn('wine', [path.join(process.cwd(), config.execName)], {cwd: path.join(process.cwd(), config.instancesDir, id)})
	cutoff.on('exit', (code, signal)=>{
		delete running[id];
		onExit(code, signal, initxt);
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

module.exports.spawnCutoff = spawnCutoff;
module.exports.create = function(ini, user, callback) {
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
			settings: ini
		};
		let instance = spawnCutoff(id, null, async(code, signal, initxt) => {
			delete running[id];
			log(`cutoff code=${code} sg=${signal} took ${(Date.now()-instance.spawned)/1000} seconds`)
			if(code === null) {
				return;	// process killed by signal
			} else if(code === 0) {
				instances[id].status = 'completed';
				instances[id].completed = new Date();
				// save .dat file with another filename
				fs.renameSync(path.join(dir, config.datFilename), path.join(dir, 'data.dat'));
				// save instance in db
				const owner = instances[id].owner;
				if(owner) {
					try {
						const q = `insert into instances(id, owner, created, completed, datetime,
${iniOrder.slice(2).join()}) values(?,?${',FROM_UNIXTIME(?/1000)'.repeat(3)+',?'.repeat(iniOrder.length-3)});`;
				        await query(q, [id, owner, instances[id].created.getTime(), Date.now()]
							.concat(Object.values(instances[id].settings).slice(1)));
					} catch(e) {
				        log(e)
						return false;
				    }
				}
			} else {
				instances[id].status = 'failed';
				instances[id].completed = new Date();
			}
		});
		log(`Spawned instance of owner (${user}): ${id}`);
		instance.cutoff.stdout.on('data', data => {
			instance.linesGot++;
		});
		callback(id);
	});
};

module.exports.getOwned = async function(user) {
	let list = [];
	const result = await query(`select id, name, settings, created, completed from instances where owner=?`, [user]);
	list = list.concat(result.map(r => Object.assign({}, r)));
	// append running instances
	for(const id in instances) {
		if(instances[id].owner == user && instances[id].status == 'processing')
			list.push({id: id, created: instances[id].created});
	}
	// set ini's, restore if needed
	/*for(const i in list) {
		const id = list[i].id;
		if(instances[id] && instances[id].status == 'processing') {
			list[i].settings = instances[id].settings;
		} else {
			const ini = list[i].settings.split('\n').slice(1);
			list[i].settings = {};
			for(const j in iniOrder)
				list[i].settings[iniOrder[j]] = ini[j];
		}
	}*/
	//console.log(list)
	return list;
};

// cache instance if not cached since this is callen before any other action
module.exports.exist = async function(id) {
	if(instances.hasOwnProperty(id))
		return true;
    try {
		if(!fs.existsSync(config.instancesDir, id)) return false;
        const result = await query(`select * from instances where id=?`, [id]);
		if(result.length > 0) {
			instances[id] = {
				created: new Date(result[0].created),
				completed: new Date(result[0].completed),
				owner: result[0].owner,
				status: 'completed',
				settings: {}
			};
			const ini = result[0].settings.split('\n').slice(1);
			for(const i in iniOrder)
				instances[id].settings[iniOrder[i]] = ini[i];
			log(`Restored instance: ${id}`);
		} else {
			delete instances[id];
		}
        return result.length > 0;
    } catch(e) {
        log(e)
		return false;
    }
};

module.exports.data = function(id) {
	if(instances[id].data)
		return instances[id].data;
	try {
		var data = fs.readFileSync(path.join(config.instancesDir, id, 'data.dat'));
	} catch(e) {
		//log(e.stack);
		return null;
	}
	instances[id].data = {};
	// на первый взгляд спагетти, но если знать формат, то нормально
	let arr = data.toString().split(/\r?\n/);
	let arr_ = arr.splice(0, arr.indexOf('Cutoff rigidities:'));
	instances[id].data.particles = arr_.map(el => el.trim().split(/\s+/).map(e => Number(e)));
	arr = arr.slice(1, 4).map(el => Number(el.trim().split(/\s+/)[1]));
	instances[id].data.lower = arr[0];
	instances[id].data.upper = arr[1];
	instances[id].data.effective = arr[2];
	return instances[id].data;
};

module.exports.available = function(id) {
	return id ? !running.hasOwnProperty(id) : Object.keys(running).length < config.maxRunningInstances;
};

module.exports.hasAccess = function(id, user, guest) {
	return guest || (instances[id].owner === user);
};

module.exports.get = function(id) {
	const obj = Object.assign({}, instances[id])
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
		await query(`update instances set name=? where id=?`, [name, id]);
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
	await query(`delete from instances where id=?`, [id]);
	const toKill = running[id];
	if(toKill)
		toKill.cutoff.kill('SIGHUP');
	log(`Deleted instance: ${id}`);
}
