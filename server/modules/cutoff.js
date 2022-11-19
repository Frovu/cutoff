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


function conesRigiditiesList() {
	let rig = .1, res = [ rig ];
	const push = (v) => res.push(parseFloat(v.toFixed(2)));
	for(let i=0; i<39; ++i) // =4
		push(rig += .1);
	for(let i=0; i<12; ++i) // =7
		push(rig += .25);
	for(let i=0; i<16; ++i) // =15
		push(rig += .5);
	for(let i=0; i<9; ++i) // =24
		push(rig += 1);
	for(let i=0; i<8; ++i) // =40
		push(rig += 2);
	for(let i=0; i<4; ++i) // =50
		push(rig += 5);
	for(let i=0; i<5; ++i)
		push(rig += 10);
	push(125);
	push(150);
	push(175);
	push(200);
	push(250);
	push(300);
	push(400);
	push(500);
	push(999.9);
	return res;
}
const rigiditiesList = conesRigiditiesList();

function serializeIni(ini, trace=null, conesRigidities=null) {
	let [date, time] = new Date(ini.datetime * 1e3).toISOString().replace(/\..*/, '').split('T');
	date = date.split('-').reverse().join('.');

	// This is a workaround for strange crash in cones
	if (ini.model === '01' || ini.model === '03')
		ini.kp = 1;

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
	const traceSettings = {
		...settings,
		lower: rigidity, upper: rigidity, step: 1,
		flightTime: settings.flightTime ?? 60
	};
	return run(id, 'cutoff', serializeIni(traceSettings, rigidity), 0, true);
}

export function runCones(id, settings, rigidity) {
	const idx = rigiditiesList.findIndex(r => r > rigidity);
	const rigidities = rigiditiesList.slice(idx);
	return run(id, 'cones', serializeIni(settings, null, rigidities), 1 / rigidities.length);
}

export function get(id) {
	return running.get(id);
}

export function kill(id) {
	running.get(id)?.process?.kill('SIGHUP');
}