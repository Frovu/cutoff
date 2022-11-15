import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

const running = new Map();

const DIR = 'instances';
const FILENAMES = {
	cutoff: {
		ini: 'CutOff.ini',
		dat: 'Cutoff.dat',
		exe: 'cutoff.exe'
	},
	cones: {
		ini: 'Cones.ini',
		dat: 'Cones.dat',
		exe: 'cones.exe'
	}
};
const INI_ORDER = ['kp', 'swdp', 'dst', 'imfBy', 'imfBz', 'g1', 'g2', 'g3',
	'model', 'alt', 'lat', 'lon', 'vertical', 'azimutal', 'lower', 'upper', 'step', 'flightTime'];

function serializeIni(ini, trace=null, conesRigidities=null) {
	let [date, time] = new Date(ini.datetime).toISOString().replace(/\..*/, '').split('T');
	date = date.split('-').reverse().join('.');

	if (conesRigidities) { // TODO: choose coordinate system (GEO [0], GSE [1] or GSM [2])
		return `\n${date}\n${time}\n${INI_ORDER.slice(0, -8).map(i => ini[i] || 0).join('\n')}\n`
			+ `0\n-180. 180.\n#\n${INI_ORDER.slice(-8, -4).map(i => ini[i]).join(' ')} =\n#\n`
			+ conesRigidities.join('\n');
	} else {
		return `\n${date}\n${time}\n${INI_ORDER.slice(0, -4).map(i => ini[i] || 0).join('\n')}\n`
			+ `${trace||(ini.lower!=0?ini.lower:ini.step)}\n${trace||ini.upper}\n`
			+ `${ini.step}\n${ini.flightTime}\n${trace?1:0}`;
	}
}

function run(id, program, iniContent, progressPerLine=0, trace=false) {
	fs.writeFileSync(path.join(DIR, id, FILENAMES[program].ini), iniContent);
	return new Promise(resolve => {
		const process = spawn('wine', [path.resolve('bin', FILENAMES[program].exe)], { cwd: path.resolve(DIR, id) });
		const spawned = Date.now();
		process.on('exit', (code, signal) => {
			const time = ((Date.now() - spawned) / 1000).toFixed(2);
			global.log(`Process ${program}${trace?'/trace':''} exited [${code??''},${signal??''}] in ${time} sec`);
			if (!trace && code === 0)
				fs.renameSync(path.join(DIR, id, FILENAMES[program].dat), path.join(DIR, id, program + '.result'));
			resolve({
				time,
				program,
				isSuccess: code === 0,
				isFail: code !== 0 && signal === null,
			});
		});
		process.stdout.on('data', () => {
			if (!progressPerLine) return;
			const record = running.get(id); 
			if (!record) return;
			record.progress += progressPerLine;
		});
		running.set(id, {
			process,
			program,
			progress: 0
		});
	});
}

export function runCutoff(id, settings) {
	return run(id, 'cutoff', serializeIni(settings), 1 / ((settings.upper - settings.lower) / settings.step * 2));
}

export function runTrace(id, settings, rigidity) {
	return run(id, 'cutoff', serializeIni(settings, rigidity), 0, true);
}

function conesRigiditiesList(cutoffRigidity) {
	let rig = Math.ceil(cutoffRigidity * 10) / 10, res = [ rig ];
	while (rig < Math.ceil(cutoffRigidity) + 1)
		res.push(rig += .1);
	while (rig < 12)
		res.push(rig += .5);
	while (rig < 20)
		res.push(rig += 1.);
	while (rig < 20)
		res.push(rig += 1.);
	while (rig < 75)
		res.push(rig += 5.);
	while (rig < 200)
		res.push(rig += 25);
	while (rig < 500)
		res.push(rig += 100);
	res.push(999.9);
	return res;
}

export function runCones(id, settings, rigidity) {
	const rigidities = conesRigiditiesList(rigidity);
	return run(id, 'cones', serializeIni(settings, null, rigidities), 1 / rigidities.length);
}

export function get(id) {
	return running.get(id);
}

export function kill(id) {
	running.get(id)?.process?.kill('SIGHUP');
}