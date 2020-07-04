const express = require('express');
const serverless = require('serverless-http');
const app = express();
const router = express.Router();
const getCollection = require('../utils/mongo');
const cors = require('cors');
app.use(cors());

router.get('/', (req, res) => {
  res.send('Info route up and running');
})

router.get('/faculties', (req, res) => {
  getCollection('faculties').then(col => {
    return col.find().toArray();
  }).then(output => {
    res.json(output);
  });
});

router.get('/faculties/:fac', (req, res) => {
  getCollection('faculties').then(col => {
    console.log(req.params.fac);
    return col.findOne({name: req.params.fac});
  }).then(output => {
    res.json(output);
  });
});

router.get('/residences', (req, res) => {
  getCollection('residences').then(col => {
    return col.find().toArray();
  }).then(output => {
    res.json(output);
  });
});

app.use('/.netlify/functions/info', router);

module.exports.handler = serverless(app);