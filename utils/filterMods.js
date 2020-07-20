const parseMod = require('./parseMod');
const assert = require('assert');

/*Accepts an array of module codes and multiple query objects. If different
query objects return different lists, the lists will be recombined to form
*/
function filterMods (modules, ...queries) {

  //Helper function to filter by attribute
  function checkFor (moduleCode, attribute, acceptedVals) {
    key = parseMod(moduleCode)[attribute];
    assert(key !== undefined);
    return acceptedVals.includes(key);    
  }

  //Helper function to create one array of filtered mods based on a query
  function helper (array, params) {
    let modList = array;

    if (params.prefix !== undefined) {
      const allowed = Array.isArray(params.prefix)
      ? params.prefix
      : [params.prefix];
      modList = modList.filter(mod => checkFor(mod, 'prefix', allowed));
    }
  
    if (params.notPrefix !== undefined) {
      const allowed = Array.isArray(params.notPrefix)
        ? params.notPrefix
        : [params.notPrefix];
      modList = modList.filter(mod => !checkFor(mod, 'prefix', allowed));
    }
  
    if (params.level !== undefined) {
      const allowed = (Array.isArray(params.level)
        ? params.level
        : [params.level]).map(item => item.toString());
      modList = modList.filter(mod => checkFor(mod, 'level', allowed));
    }
  
    if (params.notLevel !== undefined) {
      const allowed = (Array.isArray(params.notLevel)
        ? params.notLevel
        : [params.notLevel]).map(item => item.toString());
      modList = modList.filter(mod => !checkFor(mod, 'level', allowed));
    }
  
    if (params.type !== undefined) {
      const allowed = (Array.isArray(params.type)
        ? params.type
        : [params.type]).map(item => item.toString());
      modList = modList.filter(mod => checkFor(mod, 'type', allowed));
    }
  
    if (params.notType !== undefined) {
      const allowed = (Array.isArray(params.notType)
        ? params.notType
        : [params.notType]).map(item => item.toString());
      modList = modList.filter(mod => !checkFor(mod, 'type', allowed));
    }

    if (params.code !== undefined) {
      var allowed = params.code;
      allowed = allowed.map(item => parseMod(item).no_suffix)
      modList = modList.filter(mod => allowed.includes(parseMod(mod).no_suffix));
    }
  
    if (params.block !== undefined) {
      const blocked = params.block;
      modList = modList.filter(mod => !blocked.includes(mod));
    }
  
    if (params.allow !== undefined) {
      const allowed = params.allow;
      const exception = modules.filter(mod => allowed.includes(mod));
      for(let i = 0; i < exception.length; i++) {
        if ( !modList.includes(exception[i]) ) {
          modList.push(exception[i]);
        }
      }
    }

    return modList;
  }

  var output = [];
  for (let i = 0; i < queries.length; i++){
    const aList = helper(modules, queries[i]);

    for(let j = 0; j < aList.length; j++) {
      if ( !output.includes(aList[j]) ) {
        output.push(aList[j]);
      }
    }
  }
  return output;
}

const options = {
  allow: 'CS1101S'
}
const options2 = {
  level: ['BS1234', 'ACC1701X']
}
module.exports = filterMods;