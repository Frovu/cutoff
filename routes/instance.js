const express = require('express');
const router = express.Router();
const assertIni = require('../modules/assert.js');
const instance = require('../modules/instance.js');

// spawn cutoff instance
router.post('/', (req, res) => {
	if(!assertIni(req.body)) {
		return res.status(400).json({message: 'bad settings'});
	} else {
		if(!instance.available())
			return res.status(503).json({message: 'busy'});
		instance.create(req.body, (id) => {
			if(id)
				res.status(200).json({id: id});
			else
				res.status(500).json({message: 'failed to spawn'});
		});
	}
});

//router.get('/')

// request instance status/data
router.get('/:id', (req, res) => {
    const status = instance.status(req.id);
    let info = {status: status};
    if(status === 'processing')
        info.percentage = instance.percentage(req.id);
    else if(status === 'complete')
        info.data = instance.data(req.id);
	res.status(200).json(info);
});

// request trace data
router.get('/:id/:trace', (req, res) => {
	if(!instance.available(req.id)) {
        instance.trace(req.id, req.params.trace, (data) => {
            if(data)
                res.status(200).json(data);
            else
                res.status(500).json({message: 'failed'});
        });
	} else
		res.status(102).json({message: 'instance is procesing'});
});

// kill running process
router.post('/:id/kill', (req, res) => {
    if(instances.kill(req.id))
        res.status(200).json({message: 'killed'});
	else
        res.status(400).json({message: 'not running'});
});

router.param('id', (req, res, next, id) => {
    if(!instance.exist(id))
        return res.status(404).json({message: 'instance not found'});
	req.id = id;
	next();
});

module.exports = router;