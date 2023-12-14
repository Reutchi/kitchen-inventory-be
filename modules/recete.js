const express = require('express')
const router = express.Router()
const axios = require('axios')
const SESSION = 'http://127.0.0.1:5984/_session'
const REMINDERS = 'http://127.0.0.1:5984/recete'
const {init} = require("@paralleldrive/cuid2");

router.get('/', getReminders);
router.post('/', createReminder);
router.get('/:id', getReminder);
router.put('/:id', editReminder);
router.delete('/:id', deleteReminder);



const sharp = require('sharp')



router.post('/piese-moto', async ({body, files, headers}, res) => {
    const {data: {userCtx: {name, roles}}} = await axios.get(SESSION, {headers});
    // Prepare data for CouchDB
    const docData = {
        ...body,
        _attachments: {},
        images: [],
        owner: name,
        createdAt: Date.now(),
    };

    // Iterate over each file in the req.files object
    for (const key in files) {
        const image = files[key];
        const processedImage = await sharp(image.data)
            .resize(800, 600) // Resize to 800x600 or any dimensions you prefer
            .jpeg({ quality: 100 }) // Convert to JPEG with 80% quality
            .toBuffer();
        const uuid = init({ length: 10 })();

        docData._attachments[`moto-part-${uuid}`] = {
            content_type: 'image/jpeg',
            data: processedImage.toString('base64')
        };
        docData.images.push(`moto-part-${uuid}`)
    }



    delete headers['content-length']
    const {data} = await axios.post(REMINDERS, JSON.stringify(docData), {
        headers: {
            ...headers,
            'content-type': 'application/json'
        }
    });
    res.send({id: data.id, msg: 'Parts added successfully'});

});






async function getReminders({headers}, res) {
    delete headers['content-length']
    const {data: {userCtx: {name}}} = await axios(SESSION, {headers})
    const {data: {rows}} = await axios.get(`${REMINDERS}/_design/recete/_view/all`, {headers});
    const reminders = rows.map(({value}) => value)
    res.send(reminders);
}

async function createReminder({body, headers}, res) {
    delete headers['content-length']
    const {data: {userCtx: {name}}} = await axios.get(SESSION, {headers});
    const reminderData = {
        ...body,
        createdBy: name,
        createdAt: Date.now(),
    };

    const {data} = await axios.post(REMINDERS, JSON.stringify(reminderData), {
        headers: {
            ...headers,
            'content-type': 'application/json'
        }
    });
    reminderData._id = data.id
    res.send(reminderData);
}

async function getReminder({params: {id}, headers}, res) {
    delete headers['content-length']
    const {data} = await axios.get(`${REMINDERS}/${id}`, {headers});
    delete data._rev
    res.send(data);
}

async function editReminder({params: {id}, body, headers}, res) {
    delete headers['content-length']
    const {data: {userCtx: {name}}} = await axios(SESSION, {headers})
    let {data} = await axios.get(`${REMINDERS}/${id}`, {headers});
    data = {
        ...data,
        ...body
    }
    await axios.put(`${REMINDERS}/${id}`, data,{headers});
    delete data._rev
    res.send(data);
}

async function deleteReminder({params: {id}, headers}, res) {
    delete headers['content-length']
    const {data: {userCtx: {name}}} = await axios(SESSION, {headers})
    let {data} = await axios.get(`${REMINDERS}/${id}`, {headers});
    await axios.delete(`${REMINDERS}/${id}?rev=${data._rev}`, {headers});
    res.send({msg: 'Reminder deleted successfully'});
}

module.exports = router