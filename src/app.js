const express = require('express');
const serverless = require('serverless-http');
const app = express();
const router = express.Router();
const getCol = require('../utils/mongo');

router.get('/', async (req, res) => {
  const col = await getCol('rules');
  const out = await col.findOne({tag: 'r_de_basic'});
  console.log(out);
  res.send('hello world');
});

app.use('/.netlify/functions/app', router);

module.exports.handler = serverless(app);