import { useQuery } from 'react-query';
import { useState, useRef, useLayoutEffect, useEffect } from 'react';
import useResizeObserver from '@react-hook/resize-observer';
import './css/Result.css';
import Earth from './Earth.js';

function Penumbra({ data, width, height }) {
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

		const bottomHeight = 16;
		const particleWidth = canvas.width / data.particles.length;
		const particleWidthHalf = particleWidth / 2;
		const timeHeight = canvas.height / 2;
		const penumbraHeight = canvas.height - timeHeight - bottomHeight;
		const maxTime = Math.max.apply(Math, data.particles.map(particle => particle[2]));

		for (const tick of ['lower', 'upper', 'effective']) {
			const idx = data.particles.findIndex(p => p[0] === data[tick]);
			ctx.fillStyle = color.bg;
			ctx.fillRect(idx * particleWidth - 2, canvas.height - bottomHeight, 42, bottomHeight);
			ctx.fillStyle = particleColor[data.particles[idx][1]];
			ctx.fillRect(idx * particleWidth, timeHeight, particleWidth + 1, penumbraHeight + bottomHeight);
			const textX = idx * particleWidth + particleWidth + 4;
			ctx.fillStyle = color.text;
			ctx.font = style.font.replace(/\d+px/, '14px');;
			ctx.fillText('R', textX, canvas.height - 2);
			ctx.font = style.font.replace(/\d+px/, '11px');;
			ctx.fillText(tick.slice(0, 3), textX + 10, canvas.height - 2);
		}

		ctx.font = style.font;
		ctx.strokeStyle = color.text;
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (let i=0; i < data.particles.length; ++i) {
			const [rigidity, fate, time] = data.particles[i];
			const timeH = timeHeight - timeHeight * (time / maxTime);
			const x = i * particleWidth;
			if (i < 1) {
				ctx.moveTo(particleWidthHalf, timeH);
			} else {
				ctx.lineTo(x + particleWidthHalf, timeH);
				ctx.moveTo(x + particleWidthHalf, timeH);
			}

			ctx.fillStyle = particleColor[fate];
			ctx.fillRect(x, timeHeight, particleWidth + 1, penumbraHeight);

			if (hovered === i) {
				ctx.fillRect(x, timeHeight, particleWidth + 1, penumbraHeight + bottomHeight);
				const text = rigidity + ' GV';
				const textWidth = ctx.measureText(text).width;
				const textX = (canvas.width - x > textWidth + particleWidth * 3)
					? x + particleWidth + 4
					: x - textWidth - 4;
				ctx.fillStyle = color.bg;
				ctx.fillRect(textX - 3, canvas.height - bottomHeight, textWidth, bottomHeight);
				ctx.fillStyle = color.text;
				ctx.fillRect(x, timeH - particleWidthHalf, 4, 4); // point on time graph
				ctx.fillText(text, textX, canvas.height);

			}
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

	}, [data, hovered, width]);
	function mouseMove(e) {
		const rect = e.target.getBoundingClientRect();
		const x = e.clientX - rect.x;
		const i = Math.floor(x / (rect.width / data.particles.length));
		setHovered(i);
	}
	return <canvas ref={canvasRef} width={width} height={height} style={{ cursor: 'pointer', position: 'absolute', left: '8px' }}
		onMouseMove={mouseMove} onMouseOut={()=>setHovered(null)}/>;
}

function Result({ id, info, width }) {
	const query = useQuery(['result', id], () =>
		fetch(`${process.env.REACT_APP_API}api/instance/${id}/data`, { credentials: 'include' }).then(res => res.json()));
	const secondsElapsed = (new Date(info.finished) - new Date(info.created)) / 1000;
	const error = query.error ? query.error.message : query.data?.error;
	const data = !error && query.data;
	const penumbraHeight = 128;
	return (
		<>
			<div className='Result'>
				<div>
					{error && <div style={{ coor: 'red' }}>Failed to load the result</div>}
					{data && <div style={{ textAlign: 'right', width: 'fit-content' }}>
						<u>Cutoff rigidity</u><br/>
						<b>effective = {query.data.effective} GV</b><br/>
						upper = {query.data.upper} GV<br/>
						lower = {query.data.lower} GV<br/>
						<span style={{ fontSize: '14px', color: 'var(--color-text-dark)' }}>Computed in {secondsElapsed.toFixed(2)} seconds</span>
					</div>}
				</div>
				{data?.cones && <div style={{ display: 'inline-block', textAlign: 'center' }}>
					<u>Asymptotic directions</u><br/>
					<div style={{ fontSize: '12px', marginBottom: '.5em' }}>
						(10 GV) lat={data.cones.find(c => c[0] === 10)?.[1]??''} lat={data.cones.find(c => c[0] === 10)?.[2]??''}<br/>
						
					</div>
					<div>
						<textarea className='Cones' spellCheck='false' readOnly={true} value={[['R,GV', 'lat', 'lon']].concat(data.cones).map(([r, lat, lon]) =>
							`${r.toString().padStart(5, ' ')} ${(lat ?? 'N/A').toString().padStart(5, ' ')} ${(lon ?? 'N/A').toString().padStart(6, ' ')}`).join('\n')}/>
					</div>
					<div style={{ fontSize: '12px', color: 'var(--color-text-dark)' }}>
						(use Ctrl+A and Ctrl+C)
					</div>
				</div>}
			</div>
			<div className='Penumbra' style={{ minHeight: penumbraHeight + 4 + 'px', position: 'relative' }}>
				{data && <Penumbra {...{ data,
					width: width - 16,
					height: penumbraHeight 
				}}/>}
			</div>
		</>
	);
}

export default function ResultOrEarth({ id, info }) {
	const target = useRef(null);
	const [width, setWidth] = useState();
	useLayoutEffect(() => {
		setWidth(target.current.offsetWidth);
	 }, [target]);
	useResizeObserver(target, (entry) => setWidth(entry.contentRect.width));
	return (
		<>
			<Earth target={target} width={width}/>
			{info?.state === 'done' && <Result {...{ id, info, width }}/>}
		</>
	)

}