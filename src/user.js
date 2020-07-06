// Import Netlify server dependencies and export as a serverless function
const express = require("express");
const app = express();
const router = express.Router();
const cors = require('cors');
const serverless = require('serverless-http');
app.use(cors());
app.use('/.netlify/functions/user', router);
module.exports.handler = serverless(app);

// Import other dependencies and middleware
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('../models/User');
const validateRegisterInput = require('../utils/register');
const validateLoginInput = require("../utils/login");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");

// Initialise and use middleware
mongoose.connect(
  'mongodb+srv://zaiah:modtree@cluster0-scnbi.gcp.mongodb.net/modtree?retryWrites=true&w=majority', 
  { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Helper functions

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

// Route declarations
router.get('/', async (req, res) => {
  User.findOne({email: "test@test.com"})
  .then(
    console.log
  )
  res.send('hello user');
});

router.post('/register', (req, res) => {
  //Form validation
  const {errors, isValid} = validateRegisterInput(req.body);

  if (!isValid) {
    return res.status(400).json(errors);
  }

  User.findOne({ email: req.body.email, socialLogin: 'local' }).then(user => {
    if (user) {
      return res.status(409).json({ email: "Email already exists" });
    } else {
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        socialLogin: 'local'
      });
      // Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
});

router.post("/login", (req, res) => {
  // Form validation
  const { errors, isValid } = validateLoginInput(req.body);
  //Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const email = req.body.email;
  const password = req.body.password;
  // Find user by email
  User.findOne({ email: email, socialLogin: 'local' }).then(user => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ emailnotfound: "Email not found" });
    }
    // Check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // User matched
        // Create JWT Payload
        createJWT(user, (err, token) => {
          res.json({
            success: true,
            token: "Bearer " + token
          })
        });
      } else {
        return res
          .status(400)
          .json({ passwordincorrect: "Password incorrect" });
      }
    });
  });
});



