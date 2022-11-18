import React, { useRef, useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three/src/loaders/TextureLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from "three";

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

function Earth() {
	return (
		<mesh>
			<sphereGeometry args={[1, 32, 32]}/>
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

function Trace({ id, rigidity }) {
	const query = useTraceQuery(id, rigidity);
	if (!query.data) return null;
	console.log(query.data)
	return null;
}

function TraceCard({ id, rigidity }) {
	const query = useTraceQuery(id, rigidity);
	if (query.isLoading) return 'Loading';
	if (!query.data) return 'Error';
	return 'Done '+rigidity;
}

export default function EarthView({ width, height, id, traces, removeTrace }) {
	return (<>
		{traces.map(r => <TraceCard key={r} id={id} rigidity={r}/>)}
		<div style={{ position: 'absolute', top: 0, left: 0, width, height }}>
			<Canvas>
				<primitive object={new THREE.AxesHelper(3)} />
    			<CameraController />
				<ambientLight intensity={.15}/>
				<spotLight intensity={0.5} position={[100, 0, 0]} />
				<Earth/>
				{traces.map(r => <Trace key={r} id={id} rigidity={r}/>)}
			</Canvas>
		</div>
	</>);
}