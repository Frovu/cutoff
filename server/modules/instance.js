import { v4 as uuid } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import * as instances from './database.js';
import * as cutoff from './cutoff.js';

const DIR = 'instances';
const SESSIONS = 'sessions';

function doCleanup() {
	if (!fs.existsSync(DIR))
		return fs.mkdirSync(DIR);
	try {
		const sessions = fs.readdirSync(SESSIONS).map(fn => fn.slice(0, -5));
		const expired = instances.entries().filter(([,info]) => !sessions.includes(info.owner));
		expired.forEach(([id]) => instances.remove(id));
		const instanceDirs = fs.readdirSync(DIR);
		const lost = instanceDirs.filter(file => !instances.get(file));
		lost.forEach(file => fs.rmSync(path.join(DIR, file), { recursive: true }));
		global.log(`Cleanup removed ${expired.length} / ${lost.length} instances`);
		global.log(`Kept alive ${instances.entries().length} instances of ${sessions.length} sessions`);
	} catch (e) {
		global.log('Failed cleanup ' + e.stack);
	}
}
setTimeout(doCleanup, 3000);
setInterval(doCleanup, 86400 * 1000);

async function run(id, settings) {
	if (settings.mode === 'advanced') {
		const { isSuccess, isFail } = await cutoff.runCutoff(id, { ...settings });
		const instance = instances.get(id);
		if (isFail)
			return instances.set(id, {...instance, state: 'failed'});
		if (!instance || !isSuccess) // instance is probably killed
			return false;
	} else {
		const steps = [ 
			[  1,  5],
			[ .1,  4],
			[.002, 5],
		];
		let lower = 0, upper = 100;
		for (const [step, flightTime] of steps) {
			const done = await cutoff.runCutoff(id, { ...settings, step, lower, upper, flightTime });
			const instance = instances.get(id);
			if (instance && done.isFail)
				return instances.set(id, {...instances.get(id), state: 'failed'});
			if (!instance || !done.isSuccess)
				return false;
			const result = data(id, false);
			lower = result.lower - .5;
			upper = result.upper + .5;
			if (lower < step) lower = step;
		}
	}
	if (settings.noCones)
		return instances.set(id, {...instances.get(id), finished: new Date(), state: 'done'});

	const cutoffRigidity = data(id, false).effective;
	const { isSuccess, isFail } = await cutoff.runCones(id, settings, cutoffRigidity);

	const instance = instances.get(id);	
	if (isFail)
		return instances.set(id, {...instance, finished: new Date(), state: 'failed cones'});
	if (!instance || !isSuccess)
		return;
	return instances.set(id, {...instance, finished: new Date(), state: 'done'});
}

export function spawn(settings, owner) {
	const id = uuid();
	fs.mkdirSync(path.join(DIR, id));
	instances.set(id, {
		state: 'processing',
		created: new Date(),
		settings,
		owner
	});
	run(id, settings);
	return id;
}

export function remove(id) {
	try {
		if (instances.get(id)?.state === 'processing')
			cutoff.kill(id);
		instances.remove(id);
		fs.rmSync(path.join(DIR, id), {recursive: true});
	} catch {
		return;
	}
}

export function status(id) {
	const state = instances.get(id)?.state;
	if (!state) return null;
	const running = state === 'processing' && cutoff.get(id);
	return {
		state,
		...(running && {
			program: running.program,
			progress: running.progress
		}),
	};
}

export function data(id, cones=true) {
	const data = {};
	try {
		const text = fs.readFileSync(path.join(DIR, id, 'cutoff.result'));
		// на первый взгляд спагетти, но если знать формат, то нормально
		let arr = text.toString().split(/\r?\n/);
		let arr_ = arr.splice(0, arr.indexOf('Cutoff rigidities:'));
		data.particles = arr_.map(el => el.trim().split(/\s+/).map(e => Number(e)));
		arr = arr.slice(1, 4).map(el => Number(el.trim().split(/\s+/)[1]));
		data.lower = arr[0];
		data.upper = arr[1];
		data.effective = arr[2];
		if (!cones || !fs.existsSync(path.join(DIR, id, 'cones.result')))
			return data;
		const conesText = fs.readFileSync(path.join(DIR, id, 'cones.result'));
		const lines = conesText.toString().split(/\r?\n/).slice(1, -1);
		data.cones = lines.map(l => {
			const sp = l.trim().split(/\s+/);
			const rig = Number(sp[0]);
			if (l.indexOf(',') > 0) return [rig, null, null];
			return [rig, Number(sp[1]), Number(sp[2])];
		});
	} catch (e) {
		global.log(`Failed to read data: ${e.stack}`);
	}
	return data;
}

function parseTrace(filename) {
	const text = fs.readFileSync(filename);
	const trace = text.toString().split(/\r?\n/).slice(1, -1)
		.map(el => el.trim().split(/\s+/).slice(0, 4).map(e => Number(e)));
	const optimized = [trace[0]]; let oi = 0;
	const threshold = trace.length < 300 ? 0 : (trace.length<4000?0.015:0.07);
	if (threshold) {
		for (let i=1; i<trace.length; ++i) {
			const dx = trace[i][1] - optimized[oi][1];
			const dy = trace[i][2] - optimized[oi][2];
			const dz = trace[i][3] - optimized[oi][3];
			const d = Math.sqrt(dx*dx + dy*dy + dz*dz);
			if (d > threshold) {
				optimized.push(trace[i]);
				oi++;
			}
		}
	}
	return threshold ? optimized : trace;
}

export async function trace(id, rigidity) {
	const namePart = parseFloat(rigidity).toFixed(3).replace('.', '');
	const fileName = `Trace${'00000'.slice(namePart.length)}${namePart}.dat`;
	const filePath = path.join(DIR, id, fileName);
	
	if (fs.existsSync(filePath))
		return parseTrace(filePath);

	const { isSuccess } = await cutoff.runTrace(id, instances.get(id).settings, rigidity);
	return isSuccess ? fs.existsSync(filePath) && parseTrace(filePath) : null;
}
