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
	const d = new Date(ini.datetime);
	const date = `${d.getDate()>9?'':0}${d.getDate()}.${d.getMonth()>8?'':0}${d.getMonth()+1}.${d.getFullYear()}`;
	const time = d.toISOString().split('T')[1].replace(/\..*/, '');
	let text = `\n${date}\n${time}`;
	if (conesRigidities) { // TODO: choose coordinate system (GEO [0], GSE [1] or GSM [2])
		return text + `\n${INI_ORDER.slice(0, -8).map(i => ini[i]).join('\n')}\n`
			+ `0\n-180. 180.\n#\n${INI_ORDER.slice(-8, -4).map(i => ini[i]).join(' ')} =\n#\n`
			+ conesRigidities.join('\n');
	} else {
		return text + `\n${INI_ORDER.slice(0, -4).map(i => ini[i]).join('\n')}\n`
			+ `${trace||(ini.lower!=0?ini.lower:ini.step)}\n${trace||ini.upper}\n`
			+ `${ini.step}\n${ini.flightTime}\n${trace?1:0}`;
	}
}

function run(id, program, iniContent, progressPerLine) {
	fs.writeFileSync(path.join(DIR, id, FILENAMES[program].ini), iniContent);
	const process = spawn('wine', [path.resolve('bin', FILENAMES[program].exe)], { cwd: path.resolve(DIR, id) });
	const spawned = Date.now();
	process.on('exit', (code, signal) => {
		global.log(`Process ${program} exited [${code, signal}] in ${((Date.now()-spawned)/1000).toFixed(2)} sec`);
		running.set(id, {
			program,
			progress: 1,
			done: code === 0,
			failed: signal === null,
		});
	});
	process.stdout.on('data', () => {
		const record = running.get(id); 
		if (!record) return;
		record.progress += progressPerLine;
	});
	running.set(id, {
		process,
		program,
		progress: 0
	});
}

export function runCutoff(id, settings) {
	run(id, 'cutoff', serializeIni(settings));
}

export function runTrace(id, settings, rigidity) {
	run(id, 'cutoff', serializeIni(settings, rigidity));
}

export function runCones(id, settings, rigidities) {
	run(id, 'cones', serializeIni(settings, null, rigidities));
}

export function status(id) {
	return running.get(id);
}

export function kill(id) {
	running.get(id)?.process?.kill('SIGHUP');
}