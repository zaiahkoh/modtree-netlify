/*
Takes in a moduleCode as a String and parses it to return a JS Object with
keys
*/

module.exports = function parseMod (moduleCode) {
  const isLetter = (char) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
  var prefix = '';
  var number = '';
  var suffix = '';

  var c = moduleCode.charAt(0);
  while(isLetter(c) && moduleCode.length !== 0) {
    prefix += c;
    moduleCode = moduleCode.substr(1);
    c = moduleCode.charAt(0);
  }
  while(!isLetter(c) && moduleCode.length !== 0) {
    number += c;
    moduleCode = moduleCode.substr(1);
    c = moduleCode.charAt(0);
  }
  while(isLetter(c) && moduleCode.length !== 0) {
    suffix += c;
    moduleCode = moduleCode.substr(1);
    c = moduleCode.charAt(0);
  }

  return {
    moduleCode: prefix + number + suffix,
    prefix: prefix, 
    number: number, 
    suffix: suffix, 
    no_suffix: prefix + number,
    level: number.charAt(0),
    type: number.charAt(1)
  };
}