import express from 'express';
import session from 'express-session';
import fileStore from 'session-file-store';
import { config } from 'dotenv';
config();

import logging from './modules/logging.js';
import api from './modules/api.js';

global.log = logging;

const app = express();

app.use(session({
	store: new (fileStore(session)),
	secret: process.env.SECRET,
	resave: false,
	saveUninitialized: false
}));

app.use(express.json());

app.use('/api', api);

app.listen(process.env.PORT, () => global.log(`Listening to ${process.env.PORT}`));