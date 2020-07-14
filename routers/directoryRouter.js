const express = require("express");
const router = express.Router();
const getCollection = require('../utils/mongo');

// Declare helper functions
async function receiveUser (user) {
  var ruleList = [];
  var errors = {};

  //Residence requirements
  const residences = await getCollection('residences')
  const resi = await residences.findOne({tag: user.residential.tag});
  if (resi) {
    if (Array.isArray(resi.rule)){
      ruleList.push(...resi.rule);
    } else {
      ruleList.push(resi.rule);
    }
  } else {
    errors.residenceError = 'unrecognised residential tag';
  }

  //Bachelor requirements
  const bachelors = await getCollection('bachelors');
  const bach = await bachelors.findOne({tag: user.major.tag});
  if (bach) {
    if (Array.isArray(bach.rule)){
      ruleList.push(...bach.rule);
    } else {
      ruleList.push(bach.rule);
    }
  } else {
    errors.bachelorError = 'unrecognised bachelor tag';
  }

  //Second Degree requirements
  if (!Array.isArray(user.secondMajors)) {
    errors.secondMajorsError = 'secondMajor is not an Array'
  } else if ( user.secondMajors.length > 0) {
    const secondMajors = await getCollection('secondMajors');
    const majRuleArray = [];
    for (i = 0; i < user.secondMajors.length; i++) {
      const maj = await secondMajors.findOne({tag: user.secondMajors[i].tag});
      if (Array.isArray(maj.rule)) {
        majRuleArray.push(...maj.rule)
      } else {
        majRuleArray.push(maj.rule);     
      } 
    }
    ruleList = ruleList.concat(majRuleArray);
  }

  //Minor Requirements
  if (!Array.isArray(user.minors)) {
    errors.minorsError = 'minors is not an Array'
  } else if ( user.minors.length > 0) {
    const minors = await getCollection('minors');
    const minRuleArray = [];
    for (i = 0; i < user.minors.length; i++) {
      const min = await minors.findOne({tag: user.minors[i].tag});
      if (Array.isArray(min.rule)) {
        minRuleArray.push(...min.rule)
      } else {
        minRuleArray.push(min.rule);     
      }
    }
    ruleList = ruleList.concat(minRuleArray);
  }

  return {errors: errors, list: ruleList};
}

router.get('/', async (req, res) => {
  const user = req.user;
  const output = await receiveUser (user);
  console.log(output);
  res.status(200).json(output);
});

module.exports = router;