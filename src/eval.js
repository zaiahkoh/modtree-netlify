const express = require('express');
const serverless = require('serverless-http');
const app = express();
const router = express.Router();
const evaluate = require('../utils/eval');

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

router.get('/test', (req, res) => {
  evaluate('r_cs_degree', {modules: ['GEH1045', 'GES1024']})
  .then(bool => res.send(JSON.stringify(bool)));
});

router.get('/test2', (req, res) => {
  evaluate('r_de_basic', {modules: ['CS1101S', 'ACC1701']})
  .then(bool => res.send(JSON.stringify(bool)));
});

app.use('/.netlify/functions/eval', router);

module.exports.handler = serverless(app);