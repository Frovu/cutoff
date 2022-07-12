const express = require('express');
const router = express.Router();
const assertIni = require('../modules/assert.js');
const instance = require('../modules/instance.js');

router.all('*', async(req, res, next) => {
	if(!req.session.userId && !req.session.guest)
		return res.status(401).json({message: 'unauthorized'});
	try {
		await next();
	} catch(e) {
		next(e);
	}
});

// spawn cutoff instance
router.post('/', (req, res) => {
	if(!assertIni(req.body)) {
		return res.status(400).json({message: 'bad settings'});
	} else {
		if(!instance.available())
			return res.status(503).json({message: 'busy'});
		instance.create(req.body, req.session.userId, (id) => {
			if(id)
				res.status(200).json({id: id});
			else
				res.status(500).json({message: 'failed to spawn'});
		});
	}
});

// get instances owned by user
router.get('/', async(req, res) => {
	const a = await instance.getOwned(req.session.userId);
	res.status(200).json({instances: a});
});

// request instance status/data
router.get('/:id', (req, res) => {
	const resp = instance.get(req.id);
	const status = resp.status;
	if(status === 'processing')
		resp.percentage = instance.percentage(req.id);
	else if(status === 'completed') {
		resp.data = instance.data(req.id);
		if(!resp.data)
			resp.status = 'zombie';
	}
	res.status(200).json(resp);
});

// request trace data
router.get('/:id/:trace', (req, res) => {
	if(instance.available(req.id)) {
		instance.trace(req.id, req.params.trace, (data) => {
			if(data)
				res.status(200).json(data);
			else
				res.status(500).json({message: 'failed'});
		});
	} else
		res.status(102).json({message: 'instance is procesing'});
});

// set instance name
router.post('/:id/name', async(req, res) => {
	if(await instance.setName(req.id, req.body.name))
		res.status(200).json({message: 'renamed'});
	else
		res.status(500).json({message: 'failed'});
});

// kill running process
router.post('/:id/kill', async(req, res) => {
	await instance.kill(req.id);
	res.status(200).json({message: 'killed'});
});

router.param('id', async(req, res, next, id) => {
	if(!(await instance.exist(id)))
		return res.status(404).json({message: 'instance not found'});
	if(!instance.hasAccess(id, req.session.userId, req.session.guest))
		return res.status(403).json({message: 'access forbidden'});
	req.id = id;
	next();
});

module.exports = router;
