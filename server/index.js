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
	saveUninitialized: true,
	cookie: {expires: new Date(253402300000000)}
}));

app.use(express.json());

app.use('/api', api);

app.listen(process.env.PORT, () => global.log(`Listening to ${process.env.PORT}`));