import settings from './validation.json';

export function validateParam(model, key, value) {
	const req = settings[key];
	if (!value && (!req.for || req.for.includes(model))) // not present and required
		return false;
	if (req.range && !req.range.includes(value)) // not in options range
		return false;
	if (value < req.min || value > req.max)
		return false;
	return true;
}

export function validate(ini) {
	const model = ini.model;
	if (!model || !validateParam(model, 'model', model))
		return false;
	for (const key of Object.keys(settings)) {
		if (!validateParam(model, key, ini[key]))
			return false;
	}
	if (ini.lower >= ini.upper)
		return false;
	return true;
}
