const express = require('express');
const fs = require('fs-extra');

config = {
	port: 3050,
	timeToLive: 3600000,
	maxRunningInstances: 3,
	instancesDir: './cutoff/',
	execName: 'Cutoff2050.exe',
	iniFilename: 'CutOff.ini',
    datFilename: 'Cutoff.dat',
	valueRanges: './front/valueranges.json'
};

// logging
let logStream = fs.createWriteStream('./log.log', {flags:'a'});
log = function(msg) {
	console.log(msg);
	logStream.write(`[${new Date().toISOString().replace(/\..+/g, '')}] ${msg}\n`);
}

process.on('unhandledRejection', error => {
  log(error.stack);
});

const app = express();

app.use(require('compression')({ level: 9 }));
app.use(express.json()); // for parsing application/json

// TODO: remove on production
app.use(express.static('./front/'));
app.use('/instance', require('./routes/instance.js'));

// start server
app.listen(config.port, () =>
	log(`Server is started on port ${config.port}...`));
