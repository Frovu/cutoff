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
			<input style={{ width: '5em', ...(!latValid && { borderColor: 'red' }) }} type='text'
				onChange={e => setLat(e.target.value)} value={lat}></input>
			&nbsp;lon=
			<input style={{ width: '5em', ...(!lonValid && { borderColor: 'red' }) }} type='text'
				onChange={e => setLon(e.target.value)} value={lon}></input>
		</div>
	);
}

export default function Settings({ callback }) {
	const [settings, setSettings] = useState(() => {
		try {
			return JSON.parse(window.localStorage.getItem('cutoffCalcSettings')) || DEFAULT
		} catch {
			return DEFAULT;
		}
	});
	useEffect(() => window.localStorage.setItem('cutoffCalcSettings', JSON.stringify(settings)), [settings]);

	return (
		<div className='Settings'>
			<LocationInput lat={settings.lat} lon={settings.lon}
				callback={(lat, lon) => setSettings(sets => ({ ...sets, lat, lon }))}/>
		</div>
	);
}