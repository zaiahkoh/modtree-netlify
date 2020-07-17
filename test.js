/*
var request = require('request');
var options = {
  'method': 'PUT',
  'url': 'http://modtree-api.netlify.app/.netlify/functions/user/account',
  'headers': {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmMDEzYjBhMzlkMjIzMDAwNzFmYmM0YSIsIm5hbWUiOiJuZXdOYW1lIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwiaWF0IjoxNTk0ODY4OTIyLCJleHAiOjE2MjY0MjU4NDh9.YbLYPqotgU6oaof0DJlu0w_M0DLpXPmr9Uo63T2KENI',
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  form: {
    'name': 'Testy McTestFace',
    'minors': [{'tag': 'minor_management'}]
  }
};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});
*/

const assemble = require('./utils/assemble')
const compile = require('./utils/compile');
const toView = require('./utils/toView')
const util = require('util')

/*
assemble('r_ba_degree')
.then(compile)
.then(func => func({modules: ['CS1101S']}))
.then(console.log)
*/

var request = require('request');
var options = {
  'method': 'GET',
  'url': 'http://modtree-api.netlify.app/.netlify/functions/rules/assemble/r_utcp',
  'headers': {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVmMDEzYjBhMzlkMjIzMDAwNzFmYmM0YSIsIm5hbWUiOiJuZXdOYW1lIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwiaWF0IjoxNTk0ODY4OTIyLCJleHAiOjE2MjY0MjU4NDh9.YbLYPqotgU6oaof0DJlu0w_M0DLpXPmr9Uo63T2KENI',
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  form: {
    'name': 'Testy McTestFace',
    'minors': [{'tag': 'minor_management'}]
  }
};
request(options, function (error, response) {
  if (error) throw new Error(error);
  const obj = JSON.parse(response.body);
  compile(obj)
  .then(func => func({modules: ['UTC1000', 'UTS2000', 'UTC2000', 'UTW1000', 'UTW2000']}))
  .then(toView)
  .then(myObject => console.log(util.inspect(myObject, {showHidden: false, depth: null})));
  //console.log(asdf);
});