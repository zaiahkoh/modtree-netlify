const getCollection = require('./mongo');
const assert = require('assert')
const filterMods = require('./filterMods');

async function expandCodeList(array) {
  const col = await getCollection('lists');
  var output = [];
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    if (typeof item == 'object' && item.tag && item.tag.startsWith('l_')) {
      const listObj = await col.findOne({tag: item.tag});
      assert(listObj, `unrecognised list tag: ${item.tag}`)
      const modList = listObj.list;
      output.push(...modList);
    } else {
      output.push(item);
    }
  }
  
  return output;
}

//Takes in a list parameter and returns the expanded form where all list
//references have been resolved
async function expandList(list) {

  //Return an array containing a list of modules, given the filters
  async function queryList(queryObject) {
    const col = await getCollection('lists');
    const listObj = await col.findOne({tag: queryObject.tag});
    assert(listObj, `unrecognised list tag: ${queryObject.tag}`)

    return filterMods(listObj.list, queryObject);
  }

  var output = [];
  for(let i = 0; i < list.length; i++) {
    const item = list[i];
    if (typeof item == 'object' && item.tag && item.tag.startsWith('l_')) {
      var spread = await queryList(item);
      spread = spread.map(code => '?' + code);
      output.push(...spread);
    } else if (typeof item == 'string' && item.startsWith('r_')) {

      const one = await getRule(item);
      output.push(one);
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
      for (let i = 0; i < list.length; i++) {
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
      console.log('unrecognised tag: ' + ruleTag);
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
  } else {
    console.log('error parsing: ' + ruleTag);
    return undefined;
  }
  
  if (['mcs', 'nModules', 'notEmpty'].includes(ruleObj.func)) {
    if (Array.isArray(ruleObj.params.filter)) {
      for(let i = 0; i < ruleObj.params.filter.length; i++) {
        const filterParam = ruleObj.params.filter[i]
        if (filterParam !== undefined && filterParam.code !== undefined) {
          ruleObj.params.filter[i].code = await expandCodeList(filterParam.code);
        }
      }
    } else {
      const filterParam = ruleObj.params.filter
      if (filterParam !== undefined && filterParam.code !== undefined) {
        ruleObj.params.filter.code = await expandCodeList(filterParam.code);
      }
    }
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