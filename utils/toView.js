function toView(ruleObj) {

  if(ruleObj.name == undefined || ruleObj.desc == undefined) {
    return undefined;
  }

  if (['mcs', 'nModules', 'notEmpty'].includes(ruleObj.func)) {
    const { name, desc, evaluation, func } = ruleObj;
    var out = {};
    out.name = name;
    out.desc = desc;
    out.func = func;
    out.evaluation = evaluation;
    return out;
  } else if (['and', 'or', 'nTrue'].includes(ruleObj.func)) {
    const { name, desc, evaluation, func } = ruleObj;
    var out = {};
    out.name = name;
    out.desc = desc;
    out.func = func;
    out.evaluation = evaluation;
    var subList = ruleObj.params.list.map(toView);
    subList = subList.filter(item => item !== undefined);
    if (subList.length > 0) {
      out.sub = subList;
    }
    return out;
  } else if (ruleObj.func == 'filter') {
    const { name, desc, evaluation, func } = ruleObj;
    var out = {};
    out.name = name;
    out.desc = desc;
    out.func = func;
    out.evaluation = evaluation;
    const nextSub = toView(ruleObj.params.next);
    if (nextSub !== undefined) {
       out.sub[0] = nextSub 
    }
    return out;
  }
}

module.exports = toView;
