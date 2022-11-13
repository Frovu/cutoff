const settings = require('./validation.json');

function validateParam(key, value) {
	const req = settings[key];
	if (req.range && !req.range.includes(value)) // not in options range
		return false;
	if (isNaN(value)) // all non-numbers assumed to have options range
		return false;
	if (value < req.min || value > req.max)
		return false;
	return true;
}

function validate(ini) {
	const model = ini.model;
	if (!model || !validateParam('model', model))
		return false;
	for (const key of Object.keys(settings)) {
		const forModels = settings[key].for;
		if (forModels && !forModels.includes(model))
			continue;
		if (!validateParam(key, ini[key]))
			return false;
	}
	if (ini.lower >= ini.upper)
		return false;
	return true;
}

module.exports = {
	validate,
	validateParam
};