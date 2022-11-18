import React, { useRef, useState, useLayoutEffect, useEffect, useCallback } from 'react';
import { useQuery } from 'react-query';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three/src/loaders/TextureLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';

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

function Trace({ id, rigidity, callback }) {
	const query = useTraceQuery(id, rigidity);
	const ref = useRef();
	useLayoutEffect(() => {
		if (!query.data) return;
		console.log('draw trace', rigidity);
		ref.current.geometry.setFromPoints(query.data.map(p => new THREE.Vector3(p[1], p[3], p[2])));
		const p = query.data[0];
		callback(rigidity, [p[1], p[3], p[2]]);
	}, [query.data, rigidity, callback]);
	if (!query.data) return null;
	return (
		<line ref={ref}>
			<bufferGeometry/>
			<lineBasicMaterial color={'hotpink'}/>
		</line>
	);
}

function TraceCard({ id, rigidity }) {
	const query = useTraceQuery(id, rigidity);
	if (query.isLoading) return 'Loading';
	if (!query.data) return 'Error';
	return 'Done '+rigidity;
}

export default function EarthView({ width, height, id, info, traces, removeTrace }) {
	const [ launchSite, setSite ] = useState({ rigidity: 0 });
	const site = launchSite.location;
	const noTraces = traces.length < 1;
	
	let rotation = new THREE.Euler();
	if (site && info) {
		// legitimately perfectly cursed
		const siteVec = new THREE.Vector3(...site).normalize();
		const siteSph = new THREE.Spherical().setFromVector3(siteVec);
		const lon = (info.settings.lon+90) / 180 * Math.PI, lat = (90-info.settings.lat) / 180 * Math.PI;
		const rotate = new THREE.Euler(0, siteSph.theta - lon, 0);
		const rotated = new THREE.Vector3().setFromSphericalCoords(1, lat, lon).applyEuler(rotate);
		const quat = new THREE.Quaternion().setFromUnitVectors(siteVec, rotated);
		const tilt = new THREE.Euler().setFromQuaternion(quat);
		rotation = new THREE.Euler(
			-tilt.x,
			rotate.y + tilt.y,
			-tilt.z,
			'XZY'
		);
	}

	useEffect(() => {
		setSite({ rigidity: 0 });
	}, [id]);
	const callback = useCallback((rigidity, location) => {
		setSite(st => (rigidity > st.rigidity ? { rigidity, location } : st));
	}, []);
	return (<>
		{traces.map(r => <TraceCard key={r} id={id} rigidity={r}/>)}
		<div style={{ position: 'absolute', top: 0, left: 0, width, height }}>
			<Canvas>
				{!noTraces && <primitive object={new THREE.AxesHelper(3)} />}
    			<CameraController />
				<ambientLight intensity={.15}/>
				<spotLight intensity={0.3} position={[100, 0, 0]} />
				<Earth spin={noTraces} rotation={rotation}/>
				{traces.map(r => <Trace key={r} id={id} rigidity={r} callback={callback}/>)}
			</Canvas>
		</div>
	</>);
}