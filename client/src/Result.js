import { useQuery } from 'react-query';
import { useState, useRef, useEffect } from 'react';
import './css/Result.css';

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
				ctx.fillStyle = color.text;
				ctx.fillRect(x, timeH - particleWidthHalf, 4, 4);
				const text = rigidity + ' GV';
				const textWidth = ctx.measureText(text).width;
				if (canvas.width - x > textWidth + particleWidth * 3)
					ctx.fillText(text, x + particleWidth * 3, canvas.height);
				else
					ctx.fillText(text, x - textWidth - particleWidth * 3, canvas.height);

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

	}, [data, hovered]);
	function mouseMove(e) {
		const rect = e.target.getBoundingClientRect();
		const x = e.clientX - rect.x;
		const i = Math.floor(x / (rect.width / data.particles.length));
		setHovered(i);
	}
	return <canvas ref={canvasRef} width={width} height={height} style={{ cursor: 'pointer' }}
		onMouseMove={mouseMove} onMouseOut={()=>setHovered(null)}/>;
}

export default function Result({ id, info }) {
	const query = useQuery(['result', id], () =>
		fetch(`${process.env.REACT_APP_API}api/instance/${id}/data`, { credentials: 'include' }).then(res => res.json()));
	const secondsElapsed = (new Date(info.finished) - new Date(info.created)) / 1000;
	const error = query.error ? query.error.message : query.data?.error;
	const data = !error && query.data;
	
	return (
		<div className='Result'>
			<div className='ResultLeft'>
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
						<textarea className='Cones' spellcheck='false' readOnly='true' value={[['R,GV', 'lat', 'lon']].concat(data.cones).map(([r, lat, lon]) =>
							`${r.toString().padStart(5, ' ')} ${(lat ?? 'N/A').toString().padStart(5, ' ')} ${(lon ?? 'N/A').toString().padStart(6, ' ')}`).join('\n')}/>
					</div>
					<div style={{ fontSize: '12px', color: 'var(--color-text-dark)' }}>
						(use Ctrl+A and Ctrl+C)
					</div>
				</div>}
			</div>
			<div>
				{data && <Penumbra {...{ data,
					width: document.body.offsetWidth > 1280 ? 720 : 460,
					height: document.body.offsetWidth > 1280 ? 160 : 120 
				}}/>}
			</div>
		</div>
	);
}
