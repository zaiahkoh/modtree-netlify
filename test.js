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
    'minors': [{'tag': 'minor_fake'}]
  }
};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});
