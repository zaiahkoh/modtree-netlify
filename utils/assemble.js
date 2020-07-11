const assert = require('assert');
const parseMod = require('./parseMod');
const getCollection = require('./mongo');
const filterMods = require('./filterMods');

async function expandList(list) {

  //Return an array containing a list of modules, given the filters
  async function queryList(queryObject) {
    const col = await getCollection('lists');
    const listObj = await col.findOne({tag: queryObject.tag});
    assert(listObj, `unrecognised list tag: ${queryObject.tag}`)
    return filterMods(listObj, queryObject);
  }

  var output = [];
  for(i = 0; i < list.length; i++) {
    const item = list[i];
    if (typeof item == 'object' && item.tag && item.tag.startsWith('l_')) {
      var spread = await queryList(item);
      spread = spread.map(code => '?' + code);
      output.push(...spread);
    } else {
      output.push(item);
    }
  }

  return output;
}

async function getRule(ruleTag) {
  const path = ruleTag.split('/');
  const root = path.shift();
  const col = await getCollection('rules')
  const rootObj = await col.findOne({tag: root});
  if (!rootObj) {console.log(`ruleNotFound: ${ruleTag}`)}

  //Navigate the root Rule Object until it reaches the inner rule Object
  function recurse (obj, path) {
    if (path.length < 1) {
      //Base case
      return obj;

    } else if (obj.func == 'filter') {
      assert(obj.params.next == path.shift());
      //Recursive Call
      return recurse(obj.params.next, path);

    } else if (['and', 'or', 'nTrue'].includes(obj.func)) {
      var nextRule;
      const list = obj.params.list;
      const tag = path.shift();
      for (i = 0; i < list.length; i++) {
        if (typeof list[i] == 'object' && list[0].tag == tag) {
          nextRule = list[i];
        }
      }
      //Recursive call
      return recurse(nextRule, path);
    }
  }

  
  return recurse(rootObj, path);
}

function assemble(ruleTag){
  var base = getRule(ruleTag);

  function helper (ruleObj) {
    if ( ['mcs', 'nModules', 'notEmpty'].includes(ruleObj.func) ){
      return ruleObj;
    } else if ( ['and', 'or', 'nTrue'].includes(ruleObj.func) ){
      
    }
  }
}
