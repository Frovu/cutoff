import { readFileSync, writeFile } from 'fs';
import log from './logging.js';
const PATH = 'instances.json';

let storage = {};

try {
	storage = JSON.parse(readFileSync(PATH));
} catch (error) {
	log(`Failed to parse ${PATH}`);
	storage = {};
}

function writeStorage() {
	writeFile(PATH, JSON.stringify(storage, null, 2), err => {
		if (err) log(err);
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

export function entries() {
	return Object.entries(storage);
}