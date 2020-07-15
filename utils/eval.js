const getMod = require('./nusmods').getMod;
const assert = require('assert');
const parseMod = require('./parseMod');
const getCollection = require('./mongo');
const filterMods = require('./filterMods');

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
    } else {
      output.push(item);
    }
  }

  return output;
}

//Used to receive a ruleTag that starts with 'r_' and returns the corresponding
//JS Object from the Mongo Database. Can also search for nested rule Objects
//when expressed with slashes '/'. E.g. 'r_de_outer/r_de_inner'
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

//Takes in a ruleTag string and returns a function that is executed on a modPlan
//to return a boolean value of whether the rule is satisfied by the modPlan
async function compile(ruleTag) {

  //If the input is a ruleTag String, then query the database for the
  //corresponding rule Object and compile again using the object
  if (typeof ruleTag == 'string') {

    if (ruleTag.startsWith('?')) {
      moduleCode = ruleTag.substr(1);
      return planned({params: {'moduleCode': moduleCode}});
  
    } else if (ruleTag.startsWith('r_')) {
      return getRule(ruleTag).then(compile);
    }

  //Take in a rule Object and returns an async function that takes in a modPlan
  //and returns a boolean
  } else if (typeof ruleTag == 'object') { 
    ruleObj = ruleTag;
    if (ruleObj.func === 'and') {
      return and(ruleObj);
    } else if (ruleObj.func === 'or') {
      return or(ruleObj);
    } else if (ruleObj.func === 'mcs') {
      return mcs(ruleObj);
    } else if (ruleObj.func === 'filter') {
      return filter(ruleObj);
    } else if (ruleObj.func === 'notEmpty') {
      return notEmpty(ruleObj);
    } else if (ruleObj.func === 'nTrue') {
      return nTrue(ruleObj);
    } else if (ruleObj.func === 'nModules') {
      return nModules(ruleObj);
    } else {
      throw('func not recognised');
    }
  } else {
    console.error('unrecognised ruleTag');
  }
}

//Returns true if the module or its preclusions are contained within the modPlan
async function planned(ruleObj) {
  var params = ruleObj.params;
  assert(params['moduleCode'] !== undefined);
  const mod = params.moduleCode;

  const noSuffix = parseMod(mod).no_suffix;

  return (modPlan) => {
    const noSuffixList = modPlan.modules.map(str => parseMod(str).no_suffix);
    //console.log(noSuffixList);
    return noSuffixList.includes(noSuffix);
  }  
}

//Returns true if all of the sub functions return true
async function and(ruleObj) {
  var params = ruleObj.params;
  assert(params['list'] !== undefined, '"and" list not provided');
  const expandedList = await expandList(params.list);
  var funcArray = await Promise.all(expandedList.map(compile));
  return async (modPlan) => {
    var boolArray = await Promise.all(funcArray.map(func => func(modPlan)));
    return boolArray.every(bool => bool);
  }
}

//Returns true if at least one of the sub function returns true
async function or(ruleObj) {
  var params = ruleObj.params
  assert(params['list'] !== undefined);
  const expandedList = await expandList(params.list)
  var funcArray = await Promise.all(expandedList.map(compile));
  return async (modPlan) => {
    var boolArray = await Promise.all(funcArray.map(func => func(modPlan)))
    return boolArray.includes(true);
  }
}

//Returns true if at least n of the sub functions return true, and less than or
//equal to max of the sub functions return true
async function nTrue(ruleObj) {
  var params = ruleObj.params;
  assert(params['list'] !== undefined);
  assert(params['n'] !== undefined || params['max'] !== undefined);
  const n = typeof params.n == 'string'
    ? parseInt(params.n)
    : params.n
  if (params.max) {
    const max = typeof params.max == 'string'
    ? parseInt(params.max)
    : params.max
  }
  const expandedList = await expandList(params.list)
  var funcArray = await Promise.all(expandedList.map(compile));
  return async (modPlan) => {
    var boolArray = await Promise.all(funcArray.map(func => func(modPlan)));
    const numOfMods = boolArray.reduce((a, b) => a + b, 0)
    return  numOfMods >= n;
  }
}

//Returns true if the mods listed meet the number of MCs stated
function mcs(ruleObj) {
  var params = ruleObj.params;
  assert(params['n'] !== undefined);
  const mcLimit = typeof params.n === 'number'
    ? params.n
    : parseInt(params.n);
  return async (modPlan) => {
    var modList = modPlan.modules;
    if (params.filter !== undefined) {
      if (Array.isArray(params.filter)) {
        modList = filterMods(modList, ...params.filter);
      } else if (typeof params.filter == 'object') {
        modList = filterMods(modList, params.filter);
      }
    }
    const promiseArr = modList.map(code => getMod(2018, code));
    const creditArr = await Promise.all(promiseArr);
    const total = creditArr.map(item => parseInt(item.moduleCredit)).reduce((a, b) => a + b, 0);
    const output = total >= mcLimit;
    return output;
  }
}

//Checks if the modPlan contains at least n number of modules
async function nModules (ruleObj) {
  var params = ruleObj.params;
  assert(params['n'] !== undefined);

  return (modPlan) => {
    var filteredModules = modPlan.modules;
    if (params.filter !== undefined) {
      if (Array.isArray(params.filter)) {
        filteredModules = filterMods(filteredModules, ...params.filter);
      } else if (typeof params.filter == 'object') {
        filteredModules = filterMods(filteredModules, params.filter);
      }
    }
    return filteredModules.length >= params.n;
  }
}

//Filters the modPlan for certain modules and passes it to the next function
//Filtering happens in the following sequence:
//First only allow the specified modules
//Then filter by prefix and level
//Then reintroduced the excepted modules
async function filter(ruleObj) {
  var params = ruleObj.params;

  function checkFor (moduleCode, attribute, acceptedVals) {
    key = parseMod(moduleCode)[attribute];
    assert(key !== undefined);
    return acceptedVals.includes(key);
  }

  assert(params.next !== undefined);
  var nextFunc = await compile(params.next);

  return async modPlan => {
    //console.log(modPlan);
    var modList = modPlan.modules;

    if (params.modules !== undefined) {
      const allowed = params.modules;
      modList = modList.filter(mod => allowed.includes(mod));
    }

    if (params.prefix !== undefined) {
      const allowed = typeof params.prefix === 'string'
        ? [params.prefix]
        : params.prefix;
      modList = modList.filter(mod => checkFor(mod, 'prefix', allowed))
    }

    if (params.level !== undefined) {
      const allowed = (typeof params.level === 'object'
        ? params.level
        : [params.level]).map(item => item.toString());
      modList = modList.filter(mod => checkFor(mod, 'level', allowed));
    }

    if (params.type !== undefined) {
      const allowed = (typeof params.type === 'object'
        ? params.type
        : [params.type]).map(item => item.toString());
      modList = modList.filter(mod => checkFor(mod, 'type', allowed));
    }

    if (params.block !== undefined) {
      const blocked = params.block;
      modList = modList.filter(mod => !blocked.includes(mod));
    }

    if (params.allow !== undefined) {
      const allowed = params.allow;
      const exception = modPlan.modules.filter(mod => allowed.includes(mod));
      modList = modList.concat(exception);
    }
    var deepCopy = JSON.parse(JSON.stringify(modPlan));
    deepCopy.modules = modList;
    return await nextFunc(deepCopy);
  }
}

//Checks if the modPlan is not empty
async function notEmpty (ruleObj) {
  var params = ruleObj.params;
  return (modPlan) => (modPlan.modules.length !== 0);
}

async function evaluate(ruleTag, modPlan) {
  const func = await compile(ruleTag);
  const res = await func(modPlan);
  return res;
}

module.exports = evaluate;