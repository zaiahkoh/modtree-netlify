const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");
const providers = require('../config/providers');
const https = require('https');
const validateRegisterInput = require('../utils/register');
const validateLoginInput = require("../utils/login");
const User = require('../models/User');

router.get('/', async (req, res) => {
  const col = await getCol('rules');
  const out = await col.findOne({tag: 'r_de_basic'});
  console.log(out);
  res.send('hello world');
});

app.use('/.netlify/functions/app', router);

module.exports.handler = serverless(app);