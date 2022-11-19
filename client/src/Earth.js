import React, { useRef, useState, useLayoutEffect, useEffect, useCallback } from 'react';
import { useQuery } from 'react-query';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three/src/loaders/TextureLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';

const TRACE_COLOR = [
	'white',
	'orange',
	'cyan',
	'hotpink',
	'#0f0',
];
function traceColor(i) {
	return TRACE_COLOR[i % TRACE_COLOR.length];
}

const CameraController = () => {
	const { camera, gl } = useThree();
	useEffect(() => {
		const controls = new OrbitControls(camera, gl.domElement);
		controls.minDistance = 1.5;
		controls.maxDistance = 20;
		return () => {
			controls.dispose();
		};
	}, [camera, gl]);
	return null;
};

function EarthMaterial() {
	const texture = useLoader(TextureLoader, 'earth.jpg');
	return <meshLambertMaterial map={texture} reflectivity={.2}/>;
}

function Earth({ spin, rotation }) {
  	const ref = useRef();
	useFrame(() => {
		if (spin) ref.current.rotation.y += .002;
	});
	return (
		<mesh ref={ref} rotation={rotation}>
			<sphereGeometry args={[1, 48, 48]}/>
			<React.Suspense fallback={<meshLambertMaterial color={'skyblue'} wireframe={true}/>}>
				<EarthMaterial/>
			</React.Suspense>
		</mesh>
	);
}

function useTraceQuery(id, rigidity) {
	return useQuery(['trace', id, rigidity], () =>
		fetch(`${process.env.REACT_APP_API}api/instance/${id}/`+rigidity, { credentials: 'include' })
			.then(res => res.json()));
}

function Trace({ id, rigidity, callback, color }) {
	const query = useTraceQuery(id, rigidity);
	const ref = useRef();
	useLayoutEffect(() => {
		if (!query.data || query.data?.error) return;
		ref.current.geometry.setFromPoints(query.data.map(p => new THREE.Vector3(p[1], p[3], p[2])));
		const p = query.data[0];
		callback(rigidity, [p[1], p[3], p[2]]);
	}, [query.data, rigidity, callback, color]);
	if (!query.data || query.data?.error) return null;
	return (
		<line ref={ref}>
			<bufferGeometry/>
			<lineBasicMaterial color={new THREE.Color(color)}/>
		</line>
	);
}

function TraceCard({ id, rigidity, removeTrace, color }) {
	const SPIN = '\\|/-';
	const interval = useRef();
	const [ spinner, setSpinner ] = useState(0);
	const query = useTraceQuery(id, rigidity);
	useEffect(() => {
		if (!query.isLoading)
			return clearInterval(interval.current);
		interval.current = setInterval(() => {
			setSpinner(spin => spin >= SPIN.length - 1 ? 0 : spin + 1);
		}, 100);
		return () => clearInterval(interval.current);
	}, [query.isLoading]);
	return (
		<div className='TraceCard' style={{ color }} onClick={()=>removeTrace(id, rigidity)}>
			{query.isLoading && SPIN[spinner].repeat(3)}
			{(query.isError || query.data?.error) && <span style={{ color: 'red' }}>Error</span>}
			{(query.data && !query.data.error) && <>
				t={query.data[query.data.length-1][0].toFixed(1)}<br/>
				R={rigidity}
			</>}
			<span className='Close'>&times;</span>
		</div>
	);
}

export default function EarthView({ width, height, id, info, traces, removeTrace }) {
	const [ launchSite, setSite ] = useState({ rigidity: 0 });
	const AXES = ['none', 'gsm', 'rotation'];
	const [ axes, setAxes ] = useState(0);
	const site = launchSite.location;
	const noTraces = traces.length < 1;
	
	const rotation = new THREE.Euler();
	const rotAxis = new THREE.BufferGeometry();
	if (site && info) {
		// legitimately perfectly cursed
		const siteVec = new THREE.Vector3(...site).normalize();
		const siteSph = new THREE.Spherical().setFromVector3(siteVec);
		const lon = (info.settings.lon+90) / 180 * Math.PI, lat = (90-info.settings.lat) / 180 * Math.PI;
		const rotate = new THREE.Euler(0, siteSph.theta - lon, 0);
		const rotated = new THREE.Vector3().setFromSphericalCoords(1, lat, lon).applyEuler(rotate);
		const quat = new THREE.Quaternion().setFromUnitVectors(siteVec, rotated);
		const tilt = new THREE.Euler().setFromQuaternion(quat);
		rotation.set(
			-tilt.x,
			rotate.y + tilt.y,
			-tilt.z,
			'XZY'
		);

		if (AXES[axes] === 'rotation') {
			const a = new THREE.Vector3(0, 2.5, 0);
			const b = new THREE.Vector3(0, -2.5, 0);
			rotAxis.setFromPoints([a, b]);
			rotAxis.applyQuaternion(new THREE.Quaternion().setFromEuler(rotation));
		}
	}

	useEffect(() => {
		setSite({ rigidity: 0 });
	}, [id]);
	const callback = useCallback((rigidity, location) => {
		setSite(st => (rigidity > st.rigidity ? { rigidity, location } : st));
	}, []);
	return (<>
		<div className='AxesSwitch' onClick={()=>setAxes((axes + 1) % AXES.length)}>
			axes={AXES[axes]}
		</div>
		{traces.map((r, i) => <TraceCard key={r} {...{ id, removeTrace, rigidity: r, color: traceColor(i) }}/>)}
		<div style={{ position: 'absolute', top: 0, left: 0, width, height }}>
			<Canvas>
				{!noTraces && AXES[axes] === 'gsm' && <primitive object={new THREE.AxesHelper(3)} />}
				{!noTraces && AXES[axes] === 'rotation' && <line geometry={rotAxis}>
					<lineBasicMaterial color={'grey'}/>
				</line>}
    			<CameraController />
				<ambientLight intensity={.15}/>
				<spotLight intensity={0.3} position={[100, 0, 0]} />
				<Earth spin={noTraces} rotation={rotation}/>
				{traces.map((r, i) => <Trace key={r} {...{ id, callback, rigidity: r, color: traceColor(i) }}/>)}
			</Canvas>
		</div>
	</>);
}