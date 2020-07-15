const https = require('https');

exports.getMod = (acadYear, moduleCode) => {
  return new Promise((resolve, reject) => {
    const uri = 'https://api.nusmods.com/v2/' + acadYear + '-' + (acadYear + 1) 
      + '/modules/' + moduleCode + '.json';
    https.get(uri, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      })
      res.on('end', () => {
        resolve(JSON.parse(data));
      })
    }).on('error', (err) => {
      reject(err);
    })
  })
}