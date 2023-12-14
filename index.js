const express = require('express');
const cors = require('cors');
const auth = require('./modules/auth');
const recete = require('./modules/recete');
const app = express();
const port = 3002;

const fileUpload = require('express-fileupload');
app.use(fileUpload({ limits: { fileSize: 100 * 1024 * 1024 } }));

const corsOptions = {
    origin: 'http://localhost:5174', // Schimbă aceasta valoare cu domeniul aplicației tale frontend
    credentials: true, // Permite transmiterea cookie-urilor
};

app.use(cors(corsOptions));


app.use(express.json());

app.use('/auth', auth);
app.use('/recete', recete);

app.listen(port, () => {
    console.log(`Serverul rulează la adresa http://localhost:${port}`);
});
