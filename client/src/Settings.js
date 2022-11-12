import { useEffect, useState, useRef } from 'react';
import { validateParam } from './common/validation.js';
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
	datetime: Math.floor(Date.now() / 86400_000) * 86400,
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

function DateInput({ datetime, callback }) {
	const [ value, setValue ] = useState(new Date(datetime * 1e3).toISOString().replace('T', ' ').replace(/:\d\d\..*/, ''));
	useEffect(() => {
		let val = value.trim();
		val = (val.length < 14 ? val.split(' ')[0] + ' 00:00' : val) + 'Z';
		val = Date.parse(val) / 1000;
		if (val && !isNaN(val) &&  val !== datetime)
			callback(val);
	});
	return (<div>
		Date:&nbsp;
		<div className='input'>
			<input style={{ width: '11em' }} value={value} onChange={e => setValue(e.target.value)}></input>
			<div className='footer'>yyyy-mm-dd hh:mm</div>
		</div>
	</div>);
}

function LocationInput({ lat: iLat, lon: iLon, callback }) {
	const [lat, setLat] = useState(iLat.toFixed(2));
	const [lon, setLon] = useState(iLon.toFixed(2));
	const fLat = parseFloat(lat), fLon = parseFloat(lon);
	const station = Object.keys(stationList).find(k =>
		stationList[k][0] === fLat && stationList[k][1] === fLon) || 'custom';
	const latValid = !isNaN(fLat) && (fLat >= -90 && fLat <= 90);
	const lonValid = !isNaN(fLon) && (fLon >= -180 && fLon <= 180);
	useEffect(() => {
		if (latValid && lonValid && (fLat !== iLat || fLon !== iLon))
			callback(fLat, fLon);
	});
	return (
		<div style={{ display: 'inline-block' }}>
			Location:&nbsp;
			<select value={station} onChange={(e) => {
				const st = e.target.value;
				setLat(stationList[st][0].toFixed(2));
				setLon(stationList[st][1].toFixed(2));
				callback(...stationList[st].slice(0, 2));
			}}>
				<option key='custom' value='custom' disabled>(custom)</option>
				{Object.keys(stationList).map(n => <option key={n} value={n}>{n}</option>)}
			</select>
			&nbsp;lat=
			<div className='input'>
				<input style={{ width: '5em', ...(!latValid && { borderColor: 'red' }) }} type='text'
					onChange={e => setLat(e.target.value)} value={lat}></input>
				<div className='footer'>-90 to 90</div>
			</div>
			&nbsp;lon=
			<div className='input'>
				<input style={{ width: '5em', ...(!lonValid && { borderColor: 'red' }) }} type='text'
					onChange={e => setLon(e.target.value)} value={lon}></input>
				<div className='footer'>-180 to 180</div>
			</div>
		</div>
	);
}

export default function Settings({ callback }) {
	const [settings, setSettings] = useState(() => {
		try {
			return JSON.parse(window.localStorage.getItem('cutoffCalcSettings')) || DEFAULT;
		} catch {
			return DEFAULT;
		}
	});
	useEffect(() => window.localStorage.setItem('cutoffCalcSettings', JSON.stringify(settings)), [settings]);

	return (
		<div className='Settings'>
			<div className='settingsLine'>
				<LocationInput lat={settings.lat} lon={settings.lon}
					callback={(lat, lon) => setSettings(sets => ({ ...sets, lat, lon }))}/>
				<DateInput datetime={settings.datetime} callback={(datetime) => setSettings(sets => ({ ...sets, datetime }))}/>
			</div>
			<div className='settingsLine'>
				{new Date(settings.datetime * 1e3).toISOString()}
			</div>
		</div>
	);
}