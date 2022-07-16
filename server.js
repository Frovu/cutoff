require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const mysql   = require('mysql');
const util = require('util');
const db   = mysql.createPool({
	host: process.env.DB_HOST,
	user: process.env.DB_USER || 'cutoff',
	password: process.env.DB_PASS,
	database: 'cutoff'
});

// profisify db.query to not spam callbacks
global.query = util.promisify(db.query).bind(db);

global.config = {
	port: 3050,
	timeToLive: 3600000,
	maxRunningInstances: 3,
	instancesDir: './cutoff/',
	execName: 'Cutoff2050.exe',
	iniFilename: 'CutOff.ini',
	datFilename: 'Cutoff.dat',
	execCones: 'Cones2050.exe',
	iniCones: 'Cones.ini',
	datCones: 'Cones.dat',
	valueRanges: './front/valueranges.json'
};

// logging
let logStream = fs.createWriteStream('./log.log', {flags:'a'});
global.log = function(msg) {
	console.log(msg);
	logStream.write(`[${new Date().toISOString().replace(/\..+/g, '')}] ${msg}\n`);
};

process.on('unhandledRejection', error => {
	global.log(error.stack);
});

const app = express();
app.use(session({
	key: 'session_id',
	secret: process.env.SECRET,
	resave: false,
	saveUninitialized: true,
	cookie: { maxAge: 7*24*3600000, sameSite: true }
}));

app.use(require('compression')({ level: 9 }));

//app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json()); // for parsing application/json

// TODO: remove on production
app.use(express.static('./front/'));

// clear cookie if not logged in
app.use(async (req, res, next) => {
	if(req.cookies && req.cookies.session_id && !req.session.user)
		res.clearCookie('session_id');
	global.log(req.method +' '+ req.url);
	next();
});

app.use('/instance', require('./routes/instance.js'));
app.use('/user', require('./routes/user.js'));

// handle error
app.use((err, req, res, next)=>{
	global.log(`Error hadling request: ${err.stack}`);
	res.status(500).json({message: 'some error occured'});
});

// start server
app.listen(global.config.port, () =>
	global.log(`Server is started on port ${global.config.port}...`));
