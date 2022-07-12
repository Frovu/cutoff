// assert Cutoff.ini values
const ranges = require('../'+global.config.valueRanges);

module.exports = function(ini) {
	// check value ranges
	for(const param of Object.keys(ranges)) {
		if(!ini[param]) { // parameter was not specified
			// fail if param is needed for every model or for current model
			if(!ranges[param].for || ranges[param].for.includes(ini.model))
				return false;
		}
		if(ranges[param].range) {
			if(!ranges[param].range.includes(ini[param]))
				return false;
		} else {
			ini[param] = parseFloat(ini[param]);
			if(ini[param] > ranges[param].max || ini[param] < ranges[param].min)
				return false;
		}
	}
	// additional checks
	if(ini.lower >= ini.upper)
		return false;
	// forbid calculations that are about to take really much time
	if(['96', '01'].includes(ini.model) &&
	(parseFloat(ini.upper) - parseFloat(ini.lower)) /  parseFloat(ini.step)
									> (ini.model==='01'?4000:8000))
		return false;
	// all checks passed
	return true;
};
