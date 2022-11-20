import settings from './common/validation.json';

export function validateParam(key, value) {
	const req = settings[key];
	if (req.range && !req.range.includes(value)) // not in options range
		return false;
	if (isNaN(value)) // all non-numbers assumed to have options range
		return false;
	if (value < req.min || value > req.max)
		return false;
	return true;
}

export function isRequired(mode, model, key) {
	if (mode === 'simple' && ['lower', 'upper', 'step', 'flightTime'].includes(key))
		return false;
	const req = settings[key]?.for;
	if (req && !req.includes(model))
		return false;
	return true;
}

export function validate(ini) {
	const model = ini.model;
	if (!model || !validateParam('model', model))
		return false;
	for (const key of Object.keys(settings)) {
		if (!isRequired(ini.mode, model, key))
			continue;
		if (!validateParam(key, ini[key]))
			return false;
	}
	if (ini.mode === 'advanced' && ini.upper - ini.lower < ini.step)
		return false;
	return true;
}

export function filter(ini) {
	return Object.fromEntries(Object.entries(ini).filter(([key, val]) => isRequired(ini.mode, ini.model, key)));
}