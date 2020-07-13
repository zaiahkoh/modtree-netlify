// Import Netlify server dependencies and declare 'app' and 'router'
const express = require("express");
const app = express();
const router = express.Router();
const accountRouter = express.Router();
const cors = require('cors');
const serverless = require('serverless-http');
// Import other dependencies and middleware
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('../models/User');
const validateRegisterInput = require('../utils/register');
const validateLoginInput = require("../utils/login");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../config/keys");
const passport = require('passport');
const directoryRouter = require('../routers/directoryRouter');

// Initialise and use middleware
mongoose.connect(
  'mongodb+srv://zaiah:modtree@cluster0-scnbi.gcp.mongodb.net/modtree?retryWrites=true&w=majority', 
  { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
require('../config/passport')(passport);

// Declare helper functions
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
router.get('/ping', async (req, res) => {
  res.status(200).send('pong from the /user function');
});

router.post('/register', (req, res) => {
  // Form validation
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

accountRouter.get('/', (req, res) => {
  var user = req.user;
  user.password = undefined;
  res.send(user);
});

accountRouter.put('/', (req, res) => {
  var user = req.user;
  const {
    modPlan, 
    name, 
    residential, 
    major, 
    matriculationYear, 
    targetGradYear, 
    transcript,
    specialisation,
    cap,
    targetCap,
    faculty,
    facIndex,
    majorIndex
  } = req.body;
  if (modPlan !== undefined) user.modPlan = modPlan;
  if (name !== undefined) user.name = name;
  if (residential !== undefined) user.residential = residential;
  if (major !== undefined) user.major = major;
  if (matriculationYear !== undefined) user.matriculationYear = matriculationYear;
  if (targetGradYear !== undefined) user.targetGradYear = targetGradYear;
  if (transcript !== undefined) user.transcript = transcript;
  if (specialisation !== undefined) user.specialisation = specialisation;
  if (cap !== undefined) user.cap = cap;
  if (targetCap !== undefined) user.targetCap = targetCap;
  if (faculty !== undefined) user.faculty = faculty;
  if (facIndex !== undefined) user.facIndex = facIndex;
  if (majorIndex !== undefined) user.majorIndex = majorIndex;
  user.save()
  .then(user => {
    res.status(200).json({
      success: true,
      updated: {
        modPlan: modPlan,
        name: name,
        residential: residential,
        major: major,
        matriculationYear: matriculationYear,
        targetGradYear: targetGradYear,
        transcript: transcript,
        specialisation: specialisation,
        cap: cap,
        targetCap: targetCap,
        faculty: faculty,
        facIndex: facIndex,
        majorIndex: majorIndex
      }
    });
  })
  .catch(err => {
    res.status(400).json({error: err});
    console.log(err);
  });
});

accountRouter.delete('/', (req, res) => {
  var user = req.user;
  user.delete()
  .then(user => {
    user.password = undefined;
    res.status(200).json({success: true, user: user});
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({error: 'Internal server error'});
  });
});

//Set up app to use routers and export as a Netlify lambda function
app.use('/.netlify/functions/user', router);
app.use(
  '/.netlify/functions/user/account', 
  passport.authenticate('jwt', {session: false}), accountRouter);

app.use(
  '/.netlify/functions/user/directory', 
  passport.authenticate('jwt', {session: false}), directoryRouter);
  
module.exports.handler = serverless(app);