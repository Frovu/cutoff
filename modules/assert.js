// assert Cutoff.ini values
const ranges = require('../'+config.valueRanges);

module.exports = function(ini) {
	// check value ranges
	for(param of Object.keys(ranges)) {
		if(typeof ini[param] === 'undefined') { // parameter was not specified
			// fail if param is needed for every model or for current model
			if((typeof ranges[param]["for"] === 'undefined') ||
			 		(ranges[param]["for"].includes(ini["model"])) )
				return false;
		}
		if(typeof ranges[param]["range"] !== 'undefined') {
			if(!ranges[param]["range"].includes(ini[param]))
				return false;
		}
		else
			if(ini[param] > ranges[param]["max"] || ini[param] < ranges[param]["min"])
				return false;
		// round of needed
		if(ranges[param]["int"] === true) {
			ini[param] = Math.trunc(ini[param]);
		}
	}
	// additional checks
	if(ini["lower"] >= ini["upper"])
		return false;
	// all checks passed
	return true;
};
