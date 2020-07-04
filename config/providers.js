module.exports = {
  facebook: {
    url: 'https://graph.facebook.com/me',
    qs: '?fields=name,email&access_token='
  },
  google: {
    url: 'https://oauth2.googleapis.com/',
    qs: 'tokeninfo?id_token='
  }
}