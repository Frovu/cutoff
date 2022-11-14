import { useQuery } from 'react-query';
import { useState, useRef, useEffect } from 'react';
import './css/Result.css';

function Penumbra({ data, dimensions }) {
	const canvasRef = useRef();
	useEffect(() => {
		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');

	}, []);
	return <canvas ref={canvasRef} {...dimensions}/>;
}

export default function Result({ id, info }) {
	const query = useQuery(['result', id], () =>
		fetch(`${process.env.REACT_APP_API}api/instance/${id}/data`, { credentials: 'include' }).then(res => res.json()));
	const secondsElapsed = (new Date(info.finished) - new Date(info.created)) / 1000;
	return (
		<div className='Result'>
			{query.data && <div style={{ textAlign: 'right', width: 'fit-content' }}>
				<u>Cutoff rigidity</u><br/>
				<b>effective = {query.data.effective} GV</b><br/>
				upper = {query.data.upper} GV<br/>
				lower = {query.data.lower} GV
			</div>}
			<span style={{ fontSize: '14px', color: 'var(--color-text-dark)' }}>Computed in {secondsElapsed.toFixed(2)} seconds</span>
		</div>
	);
}