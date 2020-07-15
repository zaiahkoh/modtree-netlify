const getMod = require('../api/nusmods').getMod;
const assert = require('assert');
const parseMod = require('./parseMod');
const filterMods = require('./filterMods');

function evaluate(ruleTag) {
  if (typeof ruleTag == 'object') { 
    ruleObj = ruleTag;
    if (ruleObj.func === 'planned') {
      return planned(ruleObj);
    } else if (ruleObj.func === 'and') {
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

//Returns true if the mods listed contains the specified module
function planned(ruleObj) {
  var params = ruleObj.params;
  assert(params['moduleCode'] !== undefined);
  const mod = params.moduleCode;
  const noSuffix = parseMod(mod).no_suffix;
  return (modPlan) => {
    const noSuffixList = modPlan.modules.map(str => parseMod(str).no_suffix);
    const bool = noSuffixList.includes(noSuffix);
    ruleObj.evaluation = bool;
    return ruleObj;
  }  
}

//Returns true if all of the sub functions return true
async function and(ruleObj) {
  var params = ruleObj.params;
  assert(params['list'] !== undefined, '"and" list not provided');
  const expandedList = params.list;
  var funcArray = await Promise.all(expandedList.map(evaluate));
  return async (modPlan) => {
    var objArray = await Promise.all(funcArray.map(func => func(modPlan)));
    const boolArray = objArray.map(obj => obj.evaluation);
    const bool = boolArray.every(obj => obj.evaluation);
    ruleObj.evaluation = bool;
    return ruleObj;
  }
}

//Returns true if at least one of the sub function returns true
async function or(ruleObj) {
  var params = ruleObj.params
  assert(params['list'] !== undefined);
  const expandedList = params.list;
  var funcArray = await Promise.all(expandedList.map(evaluate));
  return async (modPlan) => {
    var objArray = await Promise.all(funcArray.map(func => func(modPlan)));
    const boolArray = objArray.map(obj => obj.evaluation);
    const bool = boolArray.includes(true);
    ruleObj.evaluation = bool;
    return ruleObj;
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
  const expandedList = await params.list
  var funcArray = await Promise.all(expandedList.map(evaluate));
  return async (modPlan) => {
    var objArray = await Promise.all(funcArray.map(func => func(modPlan)));
    const boolArray = objArray.map(obj => obj.evaluation);
    const numOfMods = boolArray.reduce((a, b) => a + b, 0)
    const bool = numOfMods >= n;
    ruleObj.evaluation = bool;
    return ruleObj;
  }
}

//Returns true if the mods listed meet the number of MCs stated
async function mcs(ruleObj) {
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
    const bool = total >= mcLimit;
    ruleObj.evaluation = bool;
    return ruleObj;
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
    const bool = filteredModules.length >= params.n;
    ruleObj.evaluation = bool;
    return ruleObj;
  }
}

//Checks if the modPlan is not empty
async function notEmpty (ruleObj) {
  var params = ruleObj.params;
  return (modPlan) => {
    const bool = (modPlan.modules.length !== 0);
    ruleObj.evaluation = bool;
    return ruleObj;
  };
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
  var nextFunc = await evaluate(params.next);

  return async modPlan => {
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
    const nextObj = await nextFunc(deepCopy);
    const bool = nextObj.evaluation;
    ruleObj.evaluation = bool;
    return ruleObj;
  }
}

module.exports = evaluate;