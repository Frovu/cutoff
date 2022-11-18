import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three/src/loaders/TextureLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const CameraController = () => {
	const { camera, gl } = useThree();
	useEffect(() => {
		const controls = new OrbitControls(camera, gl.domElement);
		controls.minDistance = 2;
		controls.maxDistance = 20;
		return () => {
			controls.dispose();
		};
	}, [camera, gl]);
	return null;
};

function EarthPlaceholder() {
	return (
		<mesh>
			<sphereGeometry args={[1, 16, 16]}/>
			<meshLambertMaterial color={'cyan'} wireframe={true}/>
		</mesh>
	);
}

function Earth() {
	const texture = useLoader(TextureLoader, 'earth.jpg');
	return (
		<mesh>
			<sphereGeometry args={[1, 48, 48]}/>
			<meshLambertMaterial map={texture}/>
		</mesh>
	);
}

export default function EarthView({ width, height }) {
	return (
		<div style={{ position: 'absolute', width, height }}>
			<Canvas>
    			<CameraController />
				<ambientLight/>
				<React.Suspense fallback={<EarthPlaceholder/>}>
					<Earth/>
				</React.Suspense>
			</Canvas>
		</div>
	);
}