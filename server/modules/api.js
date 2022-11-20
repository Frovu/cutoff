import { Router } from 'express';
import * as instanceStorage from './database.js';
import * as instance from './instance.js';
import * as validate from './validation.js';

const router = Router();

// get list of insances owned by session
router.get('/', (req, res) => {
	const ownedEntries = instanceStorage.entries().filter(([, inst]) => inst.owner === req.sessionID);
	const owned = Object.fromEntries(ownedEntries.map(([id, inst]) => [id, { ...inst, owner: undefined }]));
	res.status(200).json(owned);
});

router.post('/', (req, res) => {
	const settings = req.body.settings;
	if (!settings || !validate.validate(settings))
		return res.status(400).json({ error: 'Invalid settings' });
	const id = instance.spawn(settings, req.sessionID);
	req.session.init = 1;
	const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
	global.log(`Instance by (${ip}) ${settings.mode}/${settings.model} ${settings.lat},${settings.lon},${settings.vertical},${settings.azimutal}`);
	res.status(200).json({ id: id });
});

router.get('/:id', (req, res) => {
	const status = instance.status(req.id);
	res.status(200).json({
		...status,
		...(status.state === 'done' && { data: instance.data(req.id) })
	});
});

router.get('/:id/data', (req, res) => {
	const data = instance.data(req.id);
	res.status(200).json(data);
});

router.get('/:id/:trace', async (req, res) => {
	if (instance.status(req.id)?.state === 'processing')
		return res.status(400).json({ error: 'Instance didn\'t finish' });
	const trace = await instance.trace(req.id, req.params.trace);
	if (!trace)
		return res.status(500).json({ error: 'failed' });
	res.status(200).json(trace);
});

router.post('/:id/delete', (req, res) => {
	instance.remove(req.id);
	res.sendStatus(200);
});


router.param('id', async(req, res, next, id) => {
	if (!instanceStorage.get(id))
		return res.status(404).json({error: 'Instance not found'});
	if (instanceStorage.get(id).owner !== req.sessionID)
		return res.status(403).json({error: 'Access forbidden'});
	req.id = id;
	next();
});

export default router;