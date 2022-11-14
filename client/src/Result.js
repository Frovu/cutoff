import { useQuery } from 'react-query';
import { useState, useRef, useEffect } from 'react';
import './css/Result.css';

function Penumbra({ data, width }) {
	const [ hovered, setHovered ] = useState();
	const canvasRef = useRef();
	useEffect(() => {
		const canvas = canvasRef.current;
		const style = window.getComputedStyle(canvas);
		const color = {
			bg: style.getPropertyValue('--color-bg'),
			text: style.getPropertyValue('--color-text'),
			allowed: style.getPropertyValue('--color-text'),
			forbidden: style.getPropertyValue('--color-text-dark'),
		};
		const particleColor = [ color.allowed, color.forbidden, color.forbidden ];
		const ctx = canvas.getContext('2d');
		ctx.fillStyle = color.bg;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.lineWidth = 2;
		ctx.strokeStyle = color.text;
		// ctx.beginPath();
		// ctx.rect(0, 0, canvas.width, canvas.height);
		// ctx.stroke();

		const particleWidth = canvas.width / data.particles.length;
		const particleWidthHalf = particleWidth / 2;
		const timeHeight = canvas.height * 2 / 3;
		const penumbraHeight = canvas.height - timeHeight;
		const maxTime = Math.max.apply(Math, data.particles.map(particle => particle[2]));

		ctx.strokeStyle = color.text;
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (let i=0; i < data.particles.length; ++i) {
			const [, fate, time] = data.particles[i];
			const timeH = timeHeight - timeHeight * (time / maxTime);
			if (i < 1) {
				ctx.moveTo(particleWidthHalf, timeH);
			} else {
				ctx.lineTo(i * particleWidth + particleWidthHalf, timeH);
				ctx.moveTo(i * particleWidth + particleWidthHalf, timeH);
			}

			ctx.fillStyle = particleColor[fate];
			ctx.fillRect(i * particleWidth, timeHeight, particleWidth + 1, penumbraHeight);
		}
		ctx.stroke();

		ctx.font = style.font;
		ctx.fillStyle = color.text;

		const timeLabel = 'flight time, s';
		const timeMeasure = ctx.measureText(timeLabel);
		const textHeight = timeMeasure.actualBoundingBoxAscent;
		ctx.fillText(timeLabel, canvas.width - timeMeasure.width - 4, 4 + textHeight);

		const maxTimeText = maxTime.toFixed(1);
		const minTimeText = '0';
		ctx.fillText(maxTimeText, 4, textHeight + 4);
		ctx.fillText(minTimeText, 4, timeHeight - 8);

		ctx.fillStyle = color.bg;
		const leftText  = data.particles[0][0] + ' GV';
		const rightText = data.particles[data.particles.length-1][0] + ' GV';
		const y = timeHeight + textHeight / 2 + penumbraHeight / 2;
		ctx.fillText(leftText, 8, y);
		ctx.fillText(rightText, canvas.width - ctx.measureText(rightText).width - 8, y);

	}, [data]);
	return <canvas ref={canvasRef} width={width} height='128px'/>;
}

export default function Result({ id, info }) {
	const query = useQuery(['result', id], () =>
		fetch(`${process.env.REACT_APP_API}api/instance/${id}/data`, { credentials: 'include' }).then(res => res.json()));
	const secondsElapsed = (new Date(info.finished) - new Date(info.created)) / 1000;
	const error = query.error ? query.error.message : query.data?.error;
	const data = !error && query.data;
	return (
		<div className='Result'>
			<div style={{ display: 'inline-block' }}>
				{error && <div style={{ coor: 'red' }}>Failed to load the result</div>}
				{data && <div style={{ textAlign: 'right', width: 'fit-content' }}>
					<u>Cutoff rigidity</u><br/>
					<b>effective = {query.data.effective} GV</b><br/>
					upper = {query.data.upper} GV<br/>
					lower = {query.data.lower} GV
				</div>}
				<span style={{ fontSize: '14px', color: 'var(--color-text-dark)' }}>Computed in {secondsElapsed.toFixed(2)} seconds</span>
			</div>
			{data && <Penumbra {...{ data, width: '480px' }}/>}
		</div>
	);
}