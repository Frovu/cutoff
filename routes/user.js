const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcrypt');

// register
router.post('/', async (req, res, next) => {
    const r = req.body;
    if(!r || !r.email || !r.password)
        return res.status(400).json({message: 'no user data provided'});
    try {
        const result = await query(`select email from users where email=?`, [r.email]);
        if(result.length > 0)
            return res.status(409).json({message: 'email already occupied'});
        const hash = bcrypt.hashSync(r.password, 9);
        await query(`insert into users (email, password) values (?, ?)`, [r.email, hash]);
        res.status(201).json({message: 'user created'});
        log('User registered: '+r.email);
    } catch(e) {
        next(e);
    }
});

router.post('/login', async (req, res, next) => {
    const r = req.body;
    if(!r || ((!r.email || !r.password) && !r.guest))
        return res.status(400).json({message: 'no user data provided'});
    if(r.guest) {
        req.session.guest = true;
        return res.status(200).json({message: 'logged in as guest'});
    }
    try {
        const result = await query(`select id, password from users where email=?`, [r.email]);
        if(result.length == 0)
            return res.status(404).json({message: 'user not found'});
        if(!bcrypt.compareSync(r.password, result[0].password.toString()))
            return res.status(400).json({message: 'wrong password'});
        req.session.userId = result[0].id;
        res.status(200).json({message: `logged in as ${r.email}`});
    } catch(e) {
        next(e);
    }
});

router.get('/', async (req, res, next) => {
    try {
        let ans = {login: }
        if(!req.session.userId && !req.session.guest)
            return res.status(200).json({login: false});
        if(req.session.guest)
            return res.status(200).json({login: true, guest: true});
        const result = await query(`select email from users where id=?`, [req.session.userId]);
        if(result.length == 0)
            return res.status(404).json({message: 'logged user not found'});
        res.status(200).json({login: true, guest: false, username: result[0].email});
    } catch(e) {
        next(e);
    }
});

router.post('/logout', (req, res) => {
    if(req.session.userId)
        req.session.userId = null;
    res.status(200).json({message: 'logged out'});
});

module.exports = router;
