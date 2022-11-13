import express from 'express';
import session from 'express-session';
import fileStore from 'session-file-store';
import { config } from 'dotenv';
config();

import logging from './modules/logging.js';
global.log = logging;
import api from './modules/api.js';


const app = express();

app.use(session({
	store: new (fileStore(session)),
	secret: process.env.SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: {expires: new Date(253402300000000)}
}));

if (process.env.CORS_CLIENT) {
	app.use((req, res, next) => {
		res.setHeader('Access-Control-Allow-Origin', process.env.CORS_CLIENT);
		res.setHeader('Access-Control-Allow-Credentials', 'true');
		res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
		next();
	});
}

app.use(express.json());

app.use('/api/instance', api);

app.listen(process.env.PORT, () => global.log(`Listening to ${process.env.PORT}`));