const express = require('express');
const serverless = require('serverless-http');
const app = express();
const router = express.Router();
const evaluate = require('../utils/eval');
const bodyParser = require('body-parser');
const cors = require('cors');
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

router.get('/', (req, res) => {
  res.send('Pong from the eval router');
});

router.post('/', (req, res) => {
  const body = req.body;
  var modPlan = body.plan;
  var tag = body.tag;
  evaluate(tag, modPlan)
  .then(bool => res.send(bool));
});

router.get('/test/:tag', (req, res) => {
  evaluate(req.params.tag, {modules: ['GEH1045', 'GES1024']})
  .then(bool => res.send(JSON.stringify(bool)));
});

router.get('/test2', (req, res) => {
  evaluate('r_cs_breadth_and_depth', {modules: ['CS3230', 'CS3236', 'CS4234', 'CP4101']})
  .then(bool => res.send(JSON.stringify(bool)));
});

router.get('/test3', (req, res) => {
  evaluate('r_cs_foundation', {modules: ['CS1101S', 'CS1231', 'CS2030S', 'CS2040', 'CS2100', 'CS2103T', 'CS2106', 'CS3230']})
  .then(bool => res.send(JSON.stringify(bool)));
});

app.use('/.netlify/functions/eval', router);

module.exports.handler = serverless(app);