const parseMod = require('./parseMod');
const getCollection = require('./mongo');
const assert = require('assert')

//Takes in a list parameter and returns the expanded form where all list
//references have been resolved
async function expandList(list) {

  //Return an array containing a list of modules, given the filters
  async function queryList(queryObject) {
    const col = await getCollection('lists');
    const listObj = await col.findOne({tag: queryObject.tag});
    assert(listObj, `unrecognised list tag: ${queryObject.tag}`)
    var filterList = listObj.list;

    function checkFor (moduleCode, attribute, acceptedVals) {
      key = parseMod(moduleCode)[attribute];
      assert(key !== undefined);
      return acceptedVals.includes(key);
    }

    //Filter out according to the parameters
    const {prefix, suffix, level, not} = queryObject;
    if (prefix) {
      const allowed = typeof prefix === 'string'
        ? [prefix]
        : prefix;
      filterList = filterList.filter(moduleCode => 
        checkFor(moduleCode, 'prefix', allowed)
      );
    }
    if (suffix) {
      const allowed = typeof suffix === 'string'
        ? [suffix]
        : suffix;
      filterList = filterList.filter(moduleCode => 
        checkFor(moduleCode, 'suffix', allowed)
      );
    }
    if (level) {
      const allowed = (typeof level === 'object'
        ? level
        : [level]).map(item => item.toString());
      filterList = filterList.filter(moduleCode => 
        checkFor(moduleCode, 'level', allowed)
      );
    }

    return filterList;
  }

  var output = [];
  for(i = 0; i < list.length; i++) {
    const item = list[i];
    if (typeof item == 'object' && item.tag && item.tag.startsWith('l_')) {
      var spread = await queryList(item);
      spread = spread.map(code => '?' + code);
      output.push(...spread);
    } else if (typeof item == 'string' && item.startsWith('r_')) {
      output.push(await getRule(item));
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

async function assemble(ruleTag) {
  var ruleObj;
  if (typeof ruleTag == 'string' && ruleTag.startsWith('r_')) {
    ruleObj = await getRule(ruleTag);
    if (ruleObj == undefined) {
      return undefined;
    }
  } else if (typeof ruleTag == 'object'){
    ruleObj = ruleTag;
  } else if (typeof ruleTag == 'string' && ruleTag.startsWith('?')) {
    return {
      func: 'planned',
      params: {
        moduleCode: ruleTag.substr(1)
      }
    }
  }
  
  if (['mcs', 'nModules', 'notEmpty'].includes(ruleObj.func)) {
    return ruleObj;
  } else if (['and', 'or', 'nTrue'].includes(ruleObj.func)) {
    var subList = await expandList(ruleObj.params.list);
    subList = await Promise.all(subList.map(assemble));
    ruleObj.params.list = subList;
    return ruleObj;
  } else if (ruleObj.func == 'filter') {
    ruleObj.params.next = await assemble(ruleObj.params.next);
    return ruleObj;
  }
}

module.exports = assemble;