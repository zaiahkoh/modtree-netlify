const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  socialLogin: {
    type: String,
    required: true,
    enum: ['facebook', 'google', 'local']
  },
  password: {
    type: String
  },
  matriculationYear: {
    type: String
  },
  targetGradYear: {
    type: String
  },
  transcript: {
    type: Object
  },
  modPlan: {
      type: Object,
      required: true,
      default: []
  },
  cap: {
    type: Number
  },
  specialisation: {
    type: String
  },
  targetCap: {
    type: Number
  },
  residential: {
    type: Object
  },
  major: {
    type: Object,
  },
  secondMajors: {
    type: Array,
    default: []
  },
  minors: {
    type: Array,
    default: []
  },
  majorIndex: {
    type: Number
  }
});

module.exports = User = mongoose.model("users", UserSchema);