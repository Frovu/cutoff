import { readFileSync, writeFile } from 'fs';
const PATH = 'instances.json';

let storage = {};

try {
	storage = JSON.parse(readFileSync(PATH));
} catch (error) {
	global.log(`Failed to parse ${PATH}`);
	storage = {};
}

function writeStorage() {
	writeFile(PATH, JSON.stringify(storage, null, 2), err => {
		if (err) global.log(err);
	});
}

export function get(key) {
	return storage[key];
}

export function set(key, value) {
	storage[key] = value;
	writeStorage();
}

export function remove(key) {
	delete storage[key];
	writeStorage();
}