var request = require('request');
const assemble = require('./utils/assemble')
const compile = require('./utils/compile');
const toView = require('./utils/toView')
const util = require('util')
const filterMods = require('./utils/filterMods')

/*
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



/*
assemble('r_ba_degree')
.then(compile)
.then(func => func({modules: ['CS1101S']}))
.then(console.log)
*/


var request = require('request');
var options = {
  'method': 'GET',
  'url': 'http://modtree-api.netlify.app/.netlify/functions/rules/assemble/r_acc_degree',
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
  .then(func => func({modules: ['CS1101S']}))
  .then(toView)
  //.then(obj => console.log(obj.sub[0]))
  //console.log(obj.params.list[0].params.list)
  .then(myObject => console.log(util.inspect(myObject, {showHidden: false, depth: null})));
  //console.log(asdf);
});


/*
assemble('r_ceg_degree')
.then(compile)
.then(func => func({modules: ['CS4236', 'CS4238', 'DBA4811', 'FSP4003']}))
//.then(toView)
.then(myObject => console.log(util.inspect(myObject, {showHidden: false, depth: null})));
*/
