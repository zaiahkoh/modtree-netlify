const express = require('express');
const app = express();
const router = express.Router();
const getCol = require('../utils/mongo');
const serverless = require('serverless-http');
const cors = require('cors');
app.use(cors());

router.get('/', async (req, res) => {
  const col = await getCol('rules');
  const out = await col.findOne({tag: 'r_de_basic'});
  console.log(out);
  res.send('hello world');
});

app.use('/.netlify/functions/app', router);

module.exports.handler = serverless(app);