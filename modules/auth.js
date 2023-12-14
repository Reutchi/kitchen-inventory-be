const express = require('express');
const router = express.Router();
const axios = require('axios');
const joi = require('joi');
const sharp = require("sharp");
const {init} = require("@paralleldrive/cuid2");
const SESSION = 'http://127.0.0.1:5984/_session';
const ADMINURL = 'http://admin:1234@127.0.0.1:5984';

router.post('/login', login);
router.get('/login', checkLogin);
router.delete('/logout', logout);
router.post('/signup', signup);

async function login({ body: { email: username, password } }, res) {
    try {
        const schema = joi.object({
            username: joi.string().email().required(),
            password: joi.string().max(256).trim().required(),
        });
        await schema.validateAsync({ username, password });
        const { data, headers } = await axios.post(SESSION, { username, password });

        res.cookie(headers['set-cookie'][0]);
        res.send({
            name: data.name,
            role: data.roles[0],
        });
    } catch (e) {
        console.log(e);
        if (e.response && e.response.data && e.response.data.error === 'Name or password is incorrect.') {
            res.status(401).send('Name or password is incorrect.');
        } else {
            res.status(500).send('Name or password is incorrect.');
        }
    }
}


async function checkLogin({ headers }, res) {
    try {
        console.log(headers)
        const { data: { userCtx } } = await axios(SESSION, { headers });
        userCtx.name
            ? res.send({ name: userCtx.name, role: userCtx.roles[0] })
            : res.status(401).send({ msg: 'Unauthorized' });
    } catch (e) {
        console.log(e);
        res.send(e);
    }
}

async function logout(req, res) {
    try {
        const { data } = await axios.delete(SESSION);
        res.clearCookie('AuthSession');
        res.send(data);
    } catch (e) {
        console.log(e);
        res.send(e);
    }
}


async function signup(req, res) {
    try {
        const schema = joi.object({
            email: joi.string().email().required(),
            password: joi.string().required(),
            nickname: joi.string().required(),
        });
        await schema.validateAsync(req.body);

        const user = {
            id: `org.couchdb.user:${req.body.email}`,
            name: req.body.email,
            type: 'user',
            roles: ['active'],
            password: req.body.password,
            nickname: req.body.name,
        };

        const url = `${ADMINURL}/_users/${user.id}`;

        try {
            await axios.head(url);
            return res.status(409).send({ error: 'A user with this email already exists.' });
        } catch (error) {
            if (error.response && error.response.status === 404) {
                await axios.put(url, user);
                return res.send('User has successfully created!');
            }
            throw error;
        }
    } catch (e) {
        console.error(e);
        res.status(400).send(e.message);
    }
}


module.exports = router;


