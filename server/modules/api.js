import { Router } from 'express';
import * as instanceStorage from './database.js';
import * as instance from './instance.js';

const router = Router();

// get list of insances owned by session
router.get('/', (req, res) => {
	const ownedEntries = instanceStorage.entries().filter(([, inst]) => inst.owner === req.sessionID);
	const owned = Object.fromEntries(ownedEntries.map(([id, inst]) => [id, { ...inst, owner: undefined }]));
	res.status(200).json(owned);
});

router.post('/', (req, res) => {
	const settings = {};
	const id = instance.spawn(settings, req.sessionID);
	res.status(200).json({ id });
});

router.get('/:id', (req, res) => {
	const status = instance.status(req.id);
	res.status(200).json({
		...status,
		...(status.state === 'done' && { data: instance.data(req.id) })
	});
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