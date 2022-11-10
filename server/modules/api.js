import { Router } from 'express';
import * as instanceStorage from './database.js'
import * as instance from './instance.js'

const router = Router();

// get list of insances owned by session
router.get('/', (req, res) => {
	const owned = {};
	for (const [id, instance] of instanceStorage.entries()) {
		if (instance.owner === req.sessionID) {
			owned[id] = { ...instance, owner: undefined };
		}
	}
	res.status(200).json(owned);
});

router.post('/', (req, res) => {
	const settings = {};
	const id = instance.spawn(settings, req.sessionID);
	res.status(200).json({ id });
});

router.param('id', async(req, res, next, id) => {
	if (!instanceStorage.get(id))
		return res.status(404).json({message: 'Instance not found'});
	if (instanceStorage.get(id).owner !== req.sessionID)
		return res.status(403).json({message: 'Access forbidden'});
	req.id = id;
	next();
});

export default router;