const express = require('express');
const serverless = require('serverless-http');
const app = express();
const router = express.Router();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

router.get('/', async (req, res) => {
  await sleep(2000);
  res.send('hello world');
});

app.use('/.netlify/functions/app', router);


module.exports.handler = serverless(app);