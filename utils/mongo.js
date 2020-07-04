const MongoClient = require( 'mongodb' ).MongoClient;
const uri = 'mongodb+srv://zaiah:modtree@cluster0-scnbi.gcp.mongodb.net/modtree?retryWrites=true&w=majority'

var cachedDb = null;

module.exports = async (colName) => {
  if (!cachedDb) {
    const client = await MongoClient.connect(
      uri, {useNewUrlParser: true, useUnifiedTopology: true});
    const db = await client.db('modtree');
    cachedDb = db;
  }
  return cachedDb.collection(colName);
}