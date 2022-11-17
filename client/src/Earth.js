import { useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader } from 'three/src/loaders/TextureLoader';

function Earth() {
	const texture = useLoader(TextureLoader, 'earth.jpg');
  
	return (
		<mesh>
			<sphereGeometry args={[1, 100, 100]}/>
			<meshStandardMaterial map={texture}/>
		</mesh>
	);
}

export default function EarthView({ width, height }) {
	return (
		<div style={{ position: 'absolute', width, height }}>
			<Canvas>
				<ambientLight/>
				<Earth/>
			</Canvas>
		</div>
	);
}