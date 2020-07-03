const MongoClient = require( 'mongodb' ).MongoClient;
const url = require('../config/keys').mongoURI;

var _db;

module.exports = {

  connectToServer: function( callback ) {
    MongoClient.connect( url,  { useNewUrlParser: true, useUnifiedTopology: true }, function( err, client ) {
      _db  = client.db('modtree');
      return callback( err );
    } );
  },

  getDb: function() {
    return _db;
  }

};