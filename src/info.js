// Import Netlify server dependencies and declare 'app' and 'router'
const express = require("express");
const app = express();
const router = express.Router();
const cors = require('cors');
const serverless = require('serverless-http');
// Import other dependencies and middleware
const getCollection = require('../utils/mongo');

// Initialise and use middleware
app.use(cors());

// Route declarations
router.get('/ping', (req, res) => {
  res.send('pong from the /info function');
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

router.get('/residences', async (req, res) => {
  const residences = await getCollection('residences');
  const result = await residences.find(req.query).toArray();
  res.json(result);
});

router.get('/bachelors', async (req, res) => {
  const bachelors = await getCollection('bachelors');
  const result = await bachelors.find(req.query).toArray();
  res.json(result);
});

router.get('/secondMajors', async (req, res) => {
  const secondMajors = await getCollection('secondMajors');
  const result = await secondMajors.find(req.query).toArray();
  res.json(result);
});

router.get('/minors', async (req, res) => {
  const minors = await getCollection('minors');
  const result = await minors.find(req.query).toArray();
  res.json(result);
});

//Set up app to use router and export as a Netlify lambda function
app.use('/.netlify/functions/info', router);
module.exports.handler = serverless(app);