import { useEffect, useState } from 'react';
import { validateParam, validate, filter } from './validation.js';
import settingsRanges from './common/validation.json';
import stationList from './common/stations.json';
import './css/Settings.css';

export const MODEL_NAME = {
	'00': 'Dipole',
	'10': 'IGRF',
	'89': 'IGRF+T89',
	'96': 'IGRF+T96',
	'01': 'IGRF+T01',
	'03': 'IGRF+T01_S',
};

const MODEL_SETTINGS = {
	swdp: 'SWDP',
	dst: 'Dst',
	imfBy: 'IMF By',
	imfBz: 'IMF Bz',
	g1: 'G1',
	g2: 'G2',
	g3: 'G3',
	kp: 'Kp'
};

const DEFAULT = {
	mode: 'simple',
	model: '10',
	datetime: '2022-01-01',
	swdp: .5,
	dst: 0,
	imfBy: 0,
	imfBz: 0,
	g1: 2,
	g2: 7,
	g3: 10,
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

export function findStation(lat, lon) {
	return Object.keys(stationList).find(k =>
		stationList[k][0] === parseFloat(lat)
		&& stationList[k][1] === parseFloat(lon));
}

export default function Settings({ callback, settings: instanceSettings, setError }) {
	const [settings, setSettings] = useState(DEFAULT);
	useEffect(() => {
		if (!instanceSettings) return;
		const date = new Date(instanceSettings.datetime * 1e3).toISOString().replace('T', ' ').replace(/:\d\d\..*/, '');
		const datetime = date.includes('00:00') ? date.split(' ')[0] : date;
		setSettings(sets => ({ ...sets, ...instanceSettings, datetime }));
	}, [instanceSettings]);
	const submit = () => {
		const rendered = Object.fromEntries(Object.entries(filter(settings)).map(([key, val]) => [key, transformed(key, val)]));
		if (!validate(rendered))
			return setError('Invalid settings');
		callback(rendered);
	};
	const changeProp = (prop) => (e) => setSettings({ ...settings, [prop]: e.target.value });
	
	const redIfInvalid = (prop) => !validateParam(prop, transformed(prop, settings[prop])) && ({ border: '1px red solid' });

	const station = findStation(settings.lat, settings.lon) || 'custom';
	return (
		<div className='Settings'>
			<div className='settingsLine'>
				<div>
					Mode:&nbsp;
					<select value={settings.mode} onChange={changeProp('mode')}>
						<option value='simple'>simple</option>
						<option value='advanced'>advanced</option>
					</select>
				</div>
				<button style={{ color: 'var(--color-text-dark)', borderColor: 'var(--color-text-dark)', fontSize: '14px' }}
					onClick={() => setSettings({ ...DEFAULT, mode: settings.mode })}>reset settings</button>
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
				</div>
				<div style={{ display: 'inline-block' }}>
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
			<div className='settingsLine'>
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
			{!['10', '00'].includes(settings.model) && <div className='settingsLine' style={{ maxWidth: '32em' }}>
				{Object.entries(MODEL_SETTINGS)
					.filter(([key]) => settingsRanges[key]?.for.includes(settings.model))
					.map(([key, name]) => <div key={key}>
						<div className='input'>
							{name}:
							<input type='text' value={settings[key]}
								style={{ width: '3.5em', margin: '0 6px 0 2px', ...redIfInvalid(key) }}
								onChange={changeProp(key)}></input>
							<div className='footer'>
								{settingsRanges[key].min} to {settingsRanges[key].max}
							</div>
						</div>
					</div>)}
			</div>}
			<div className='settingsLine'>
				<div>
					Direction:
				</div>
				<div>
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
			{settings.mode === 'advanced' && <>
				<div className='settingsLine'>
					<div>
						Rigidity range:
						from
						<input value={settings.lower} onChange={changeProp('lower')}
							style={{ width: '3em', margin: '0 6px 0 6px', ...redIfInvalid('lower') }}/>
						to
						<input value={settings.upper} onChange={changeProp('upper')}
							style={{ width: '3em', margin: '0 6px 0 6px', ...redIfInvalid('upper') }}/>
						GV, step=
						<select value={settings.step} onChange={changeProp('step')}>
							<option value='0.1'>0.1</option>
							<option value='0.01'>0.01</option>
							<option value='0.001'>0.001</option>
						</select>
					</div>
				</div>
				<div className='settingsLine'>
					<div>
						Max flight time:
						<input value={settings.flightTime} onChange={changeProp('flightTime')}
							style={{ width: '2.5em', margin: '0 6px 0 6px', ...redIfInvalid('flightTime') }}/>
						seconds
					</div>
				</div>
			</>}
		</div>
	);
}