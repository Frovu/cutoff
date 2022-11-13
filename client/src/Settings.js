import { useEffect, useState } from 'react';
import { validateParam, validate } from './common/validation.js';
import stationList from './common/stations.json';
import './css/Settings.css';

const MODEL_NAME = {
	'00': 'Dipole',
	'10': 'IGRF',
	'89': 'IGRF+T89',
	'96': 'IGRF+T96',
	'01': 'IGRF+T01',
	'03': 'IGRF+T01_S',
};

const DEFAULT = {
	mode: 'simple',
	model: '10',
	datetime: '2022-01-01',
	swdp: .5,
	alt: 20,
	lat: 55.47,
	lon: 37.32,
	vertical: 0,
	azimutal: 0,
	flightTime: 5,
	lower: 1,
	upper: 4,
	step: .01
};

const TRANSFORM = {
	datetime: (text) => {
		let val = text.trim();
		val = (val.length < 14 ? val.split(' ')[0] + ' 00:00' : val) + 'Z';
		return Date.parse(val) / 1000;
	},
	mode: v => v,
	model: v => v,
	default: parseFloat
};

function transformed(prop, value) {
	const transform = TRANSFORM[prop] || TRANSFORM.default;
	return transform(value);
}

export default function Settings({ callback }) {
	const [error, setError] = useState();
	useEffect(() => {
		const timeout = setTimeout(() => setError(null), 3000);
		return () => clearTimeout(timeout);
	}, [error]);
	const [settings, setSettings] = useState(() => {
		try {
			return JSON.parse(window.localStorage.getItem('cutoffCalcSettings')) || DEFAULT;
		} catch {
			return DEFAULT;
		}
	});
	const submit = () => {
		if (!validate(settings))
			return setError('Invalid settings');
		window.localStorage.setItem('cutoffCalcSettings', JSON.stringify(settings));
		callback(settings);
	};
	const changeProp = (prop) => (e) => setSettings({ ...settings, [prop]: e.target.value });
	
	const redIfInvalid = (prop) => !validateParam(prop, transformed(prop, settings[prop])) && ({ border: '1px red solid' });

	const station = Object.keys(stationList).find(k =>
		stationList[k][0] === parseFloat(settings.lat)
		&& stationList[k][1] === parseFloat(settings.lon)) || 'custom';
	return (
		<div className='Settings'>
			<div className='settingsLine'>
				<div>
					Mode:&nbsp;
					<select value={settings.mode} onChange={changeProp('mode')}>
						<option value='simple'>simple</option>
						<option value='advanced'>advanced</option>
						<option value='multi'>multi</option>
					</select>
				</div>
				<button style={{ color: 'var(--color-text-dark)', borderColor: 'var(--color-text-dark)', fontSize: '14px' }}
					onClick={() => setSettings(DEFAULT)}>reset settings</button>
				<button style={{ width: '8em', fontWeight: 'bold', boxShadow: '0 0 8px 2px var(--color-active)' }}
					onClick={submit}>- Compute -</button>
			</div>
			<div className='settingsLine'>
				<div style={{ display: 'inline-block' }}>
					Location:&nbsp;
					<select value={station} onChange={(e) => {
						const st = e.target.value;
						setSettings({ ...settings, lat: stationList[st][0], lon: stationList[st][1] });
					}}>
						<option key='custom' value='custom' disabled>(custom)</option>
						{Object.keys(stationList).map(n => <option key={n} value={n}>{n}</option>)}
					</select>
					&nbsp;lat=
					<div className='input'>
						<input style={{ width: '5em', ...redIfInvalid('lat') }} type='text'
							onChange={changeProp('lat')} value={settings.lat}></input>
						<div className='footer'>-90 to 90</div>
					</div>
					&nbsp;lon=
					<div className='input'>
						<input style={{ width: '5em', ...redIfInvalid('lon') }} type='text'
							onChange={changeProp('lon')} value={settings.lon}></input>
						<div className='footer'>-180 to 180</div>
					</div>
				</div>
			</div>
			<div className='settingsLine'>
				<div>
					Field model:&nbsp;
					<select value={settings.model} onChange={e => setSettings({ ...settings, model: e.target.value })}>
						{Object.entries(MODEL_NAME).map(([id, tag]) => <option key={tag} value={id}>{tag}</option>)}
					</select>
				</div>
			</div>
			<div className='settingsLine' style={{ height: '2em' }}>
				<div>
					Date:&nbsp;
					<div className='input'>
						<input style={{ width: '11em', ...redIfInvalid('datetime') }} value={settings.datetime}
							onChange={changeProp('datetime')}></input>
						<div className='footer'>yyyy-mm-dd hh:mm</div>
					</div>
				</div>
				<div>
					Altitude:
					<input type='text' value={settings.alt}
						style={{ width: '3.5em', margin: '0 6px 0 2px', ...redIfInvalid('alt') }}
						onChange={changeProp('alt')}></input>
					km
				</div>
			</div>
			<div className='settingsLine'>
				<div>
					Direction:
					vertical=
					<input type='text' value={settings.vertical}
						style={{ width: '3.5em', margin: '0 2px 0 2px', ...redIfInvalid('vertical') }}
						onChange={changeProp('vertical')}></input>
					°
					azimuth=
					<input type='text' value={settings.azimutal}
						style={{ width: '3.5em', margin: '0 2px 0 2px', ...redIfInvalid('azimutal') }}
						onChange={changeProp('azimutal')}></input>
					°
				</div>
			</div>
			<div className='settingsLine' style={{ color: 'red' }}>
				{error}
			</div>
			
		</div>
	);
}