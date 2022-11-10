import { v4 as uuid} from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import * as instances from './database';
import * as cutoff from './cutoff';

const DIR = 'instances';

function clearDeadInstances() {
	if (!fs.existsSync(DIR))
		return fs.mkdirSync(DIR);
	fs.readdir(DIR, (err, files) => {
		files.filter(file => !instances.has(file)).forEach(file => {
			fs.removeSync(path.join(DIR, file));
		});
	});
}
clearDeadInstances();

export function spawn(settings) {
	const id = uuid();
	fs.mkdirSync(path.join(DIR, id));
	instances.set(id, {
		state: 'processing',
		created: new Date(),
		settings,
	});
	cutoff.runCutoff(id, settings, ({ isSuccess, isFail }) => {
		const instance = instances.get(id);
		instance.finished = new Date();
		if (isFail)
			return instances.set(id, {...instance, state: 'failed'});
		if (!isSuccess)
			return;
		if (!settings.cones)
			return instances.set(id, {...instance, state: 'done'});

		const cutoffRigidity = data(id).effective;
		cutoff.runCones(id, settings, cutoffRigidity, ({ isSuccess, isFail }) => {
			instance.finished = new Date();
			if (isFail)
				return instances.set(id, {...instance, state: 'failed cones'});
			if (!isSuccess)
				return;
			
			instances.set(id, {...instance, state: 'done'});
		});
	});
	return id;
}

export function kill(id) {
	cutoff.kill(id);
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

export function data(id) {

}

export function trace(id, rigidity) {

}
