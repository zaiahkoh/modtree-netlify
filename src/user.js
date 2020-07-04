const express = require("express");
const mongoose = require('mongoose');
const User = require('../models/User');
const serverless = require('serverless-http');

const app = express();
const router = express.Router();

mongoose.connect(
  'mongodb+srv://zaiah:modtree@cluster0-scnbi.gcp.mongodb.net/modtree?retryWrites=true&w=majority', 
  { useNewUrlParser: true, useUnifiedTopology: true });

function createJWT (user, callback) {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email
  }
  jwt.sign(
    payload,
    keys.secretOrKey,
    {
      expiresIn: 31556926 // 1 year in seconds
    },
    (err, token) => {
      callback(err, token);
    }
  );
}

router.get('/', async (req, res) => {
  User.findOne({email: "test@test.com"})
  .then(
    console.log
  )
  res.send('hello user');
});

app.use('/.netlify/functions/user', router);

module.exports.handler = serverless(app);