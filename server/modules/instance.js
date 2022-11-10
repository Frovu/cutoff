import { v4 as uuid} from 'uuid';
import { join as path } from 'path';
import * as fs from 'fs';
import * as database from './database';
import * as cutoff from './cutoff';

const DIR = 'instances';

let instances = {};

function clearDeadInstances() {
	if (!fs.existsSync(DIR))
		return fs.mkdirSync(DIR);
	fs.readdir(DIR, (err, files) => {
		files.filter(file => !database.get(file)).forEach(file => {
			fs.removeSync(path(DIR, file));
		});
	});
}
clearDeadInstances();

export function spawn(settings) {
	const id = uuid();
	const dir = path(DIR, id);
	fs.mkdirSync(dir);
	instances[id] = {
		status: 'processing',
		created: new Date(),
		settings,
	};
	return id;
}

export function kill(id) {

}

export function status(id) {

}

export function data(id) {

}

export function trace(id, rigidity) {

}
