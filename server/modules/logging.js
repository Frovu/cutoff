import { existsSync, mkdirSync, createWriteStream, readdirSync, createReadStream, unlinkSync } from 'fs';
import { join } from 'path';
import { createGzip } from 'zlib';

const DIR = 'logs';
const filename = () => new Date().toISOString().replace(/T.*/, '') + '.log';
const path = file => join(DIR, file);
let currentFile, writeStream;

function switchFiles() {
	if (currentFile === filename()) return writeStream;
	if (!existsSync(path('archive'))) mkdirSync(path('archive'));
	currentFile = filename();
	writeStream = createWriteStream(path(currentFile), {flags: 'a'});
	// gzip all not gziped log files except current
	readdirSync(DIR).forEach(file => {
		if (!file.endsWith('.log') || file === currentFile) return;
		const fileContents = createReadStream(path(file));
		const writeStream = createWriteStream(join(DIR, 'archive', file + '.gz'));
		fileContents.pipe(createGzip()).pipe(writeStream).on('finish', (err) => {
			if (err) global.log(`Failed to gzip: ${err}`);
			else unlinkSync(path(file));
		});
	});
	return writeStream;
}
switchFiles();

export default (msg) => {
	console.log(msg);
	switchFiles().write(`[${new Date().toISOString().replace(/\..+/g, '')}] ${msg}\n`);
};
