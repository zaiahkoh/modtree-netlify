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

router.get('/residences', (req, res) => {
  getCollection('residences').then(col => {
    return col.find().toArray();
  }).then(output => {
    res.json(output);
  });
});

//Set up app to use router and export as a Netlify lambda function
app.use('/.netlify/functions/info', router);
module.exports.handler = serverless(app);