import { useQuery } from 'react-query';
import { useState, useRef, useLayoutEffect, useEffect, useCallback } from 'react';
import useResizeObserver from '@react-hook/resize-observer';
import './css/Result.css';
import Earth, { traceColor } from './Earth.js';

const MAX_TRACES = 5;

function Penumbra({ data, width, height, callback, traces }) {
	const [ hovered, setHovered ] = useState();
	const canvasRef = useRef();
	useEffect(() => {
		// console.time('draw penumbra');
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

		ctx.font = style.font;
		ctx.strokeStyle = color.text;
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (let i=0; i < data.particles.length; ++i) {
			const [, fate, time] = data.particles[i];
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
		}
		ctx.stroke();

		for (const [i, trace] of traces.entries()) {
			const idx = data.particles.findIndex(p => p[0] === trace);
			if (idx >= 0) {
				ctx.fillStyle = traceColor(i);
				ctx.fillRect(idx * particleWidth, timeHeight, particleWidth + 1, penumbraHeight + bottomHeight);
			}
		}

		for (const tick of ['lower', 'upper', 'effective']) {
			const idx = data.particles.findIndex(p => p[0] === data[tick]);
			if (idx < 0) continue;
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
		if (hovered != null) {
			const timeH = timeHeight - timeHeight * (data.particles[hovered][2] / maxTime);
			const x = hovered * particleWidth;
			ctx.fillRect(x, timeHeight, particleWidth + 1, penumbraHeight + bottomHeight);
			const text = data.particles[hovered][0] + ' GV';
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
		// console.timeEnd('draw penumbra');
	}, [data, hovered, width, traces]);
	function posToIndex(e) {
		const rect = e.target.getBoundingClientRect();
		const x = e.clientX - rect.x;
		return Math.floor(x / (rect.width / data.particles.length));
	}
	function mouseMove(e) {
		setHovered(posToIndex(e));
	}
	function click(e) {
		callback(data.particles[posToIndex(e)][0]);
	}
	return <canvas ref={canvasRef} width={width} height={height} style={{ cursor: 'pointer', position: 'absolute', left: '8px' }}
		onMouseMove={mouseMove} onMouseOut={()=>setHovered(null)} onClick={click}/>;
}

function useResultQuery(id) {
	return useQuery(['result', id], () =>
		fetch(`${process.env.REACT_APP_API}api/instance/${id}/data`, { credentials: 'include' })
			.then(res => res.json()));
}

function ResultPenumbra({ id, width, callback, traces }) {
	const query = useResultQuery(id);
	const height = 128;
	if (!query?.data) return null;
	return (
		<div className='Penumbra' style={{ minHeight: height + 4 + 'px', position: 'relative' }}>
			<Penumbra {...{
				data: query.data,
				width: width - 16,
				height: height,
				callback,
				traces
			}}/>
		</div>
	);	
}

function ResultText({ id, info }) {
	const [ json, setJson ] = useState(false);
	const query = useResultQuery(id);
	const secondsElapsed = (new Date(info.finished) - new Date(info.created)) / 1000;
	const error = query.error ? query.error.message : query.data?.error;
	const data = !error && query.data;
	return (
		<div className='ResultText'>
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
				<div style={{ fontSize: '12px', marginBottom: '4px' }}>
					(10 GV) lat={data.cones.find(c => c[0] === 10)?.[1]??''} lon={data.cones.find(c => c[0] === 10)?.[2]??''}
				</div>
				<div>
					<textarea className='Cones' spellCheck='false' readOnly={true} value={
						json ? JSON.stringify(data.cones, null, 2) :
							[['R,GV', 'lat', 'lon']].concat(data.cones).map(([r, lat, lon]) =>
								`${r.toString().padStart(5, ' ')} ${(lat ?? 'N/A').toString().padStart(5, ' ')} ${(lon ?? 'N/A').toString().padStart(6, ' ')}`).join('\n')}/>
				</div>
				<div style={{ fontSize: '12px', color: 'var(--color-text-dark)' }}>
					(use Ctrl+A and Ctrl+C)
				</div>
				<div className='Switch' style={{ fontSize: '12px', color: 'var(--color-text-dark)' }} onClick={()=>setJson(!json)}>
					format={json ? 'json' : 'plaintext'}
				</div>
			</div>}
		</div>
	);
}

function ResultCones({ id, info }) {
	const query = useResultQuery(id);
	const canvasRef = useRef(null);
	const target = useRef(null);
	const [width, setWidth] = useState(0);
	const height = width * 514 / 900;
	useLayoutEffect(() => {
		setWidth(target.current.offsetWidth);
	 }, [target]);
	useResizeObserver(target, (entry) => setWidth(entry.contentRect.width));
	useEffect(() => {
		const ctx = canvasRef.current.getContext('2d');
		const image = new Image();
  		image.src = 'earthOutline.png';
		image.onload = () => {
			if (!query.data?.cones) return;
			const style = window.getComputedStyle(canvasRef.current);
			const color = {
				red: 'red',
				hotpink: 'hotpink',
				bg: style.getPropertyValue('--color-bg'),
				text: style.getPropertyValue('--color-text'),
				active: style.getPropertyValue('--color-active'),
			};
			ctx.fillStyle = color.bg;
			ctx.fillRect(0, 0, width, height);
			ctx.drawImage(image, 0, 0, width, height);

			const coords = (lat, lon) => [
				(lon + 180) / 360 * width,
				(90 - lat) / 180 * height,
			];

			const [sx, sy] = coords(info.settings.lat, info.settings.lon);

			const drawTriangle = (x, y, size) => {
				ctx.strokeStyle = color.red;
				ctx.lineWidth = 1;
				ctx.beginPath();
				ctx.moveTo(x, y - 1);
				ctx.lineTo(x + size / 2, y + size);
				ctx.lineTo(x - size / 2, y + size);
				ctx.closePath();
				ctx.stroke();

			};
			drawTriangle(sx, sy, 12);

			for (const [rig, lat, lon] of query.data.cones) {
				const [x, y] = coords(lat, lon);
				ctx.fillStyle = rig > 10 ? color.hotpink : color.active;
				ctx.beginPath();
				ctx.arc(x, y, 2, 0, 2 * Math.PI);
				ctx.fill();
			}

			ctx.font = style.font.replace(/\d+px/, '12px');
			const locText = info.settings.lat + ', ' + info.settings.lon;
			const measure = ctx.measureText(locText);
			const lw = (measure.width > 66 ? measure.width : 66) + 24;
			const lh = 50;
			const lx = 8, ly = height - lh - height / 7;
			ctx.strokeStyle = color.text;
			ctx.lineWidth = 1;
			ctx.strokeRect(lx, ly, lw, lh);
			drawTriangle(lx + 10, ly + 6, 8);
			ctx.fillStyle = color.active;
			ctx.beginPath();
			ctx.arc(lx + 10, ly + 25, 4, 0, 2 * Math.PI);
			ctx.fill();
			ctx.fillStyle = color.hotpink;
			ctx.beginPath();
			ctx.arc(lx + 10, ly + 40, 4, 0, 2 * Math.PI);
			ctx.fill();
			ctx.fillStyle = color.text;
			ctx.fillText(locText, lx + 20, ly + 14);
			ctx.fillText('R <=10 GV', lx + 20, ly + 30);
			ctx.fillText('R > 10 GV', lx + 20, ly + 45);
		};
	}, [width, height, query.data, info]);

	return (
		<div ref={target} className='ResultCones' style={{ position: 'relative', height, margin: '11px', border: '1px solid' }}>
			<canvas ref={canvasRef} width={width-1} height={height-2} style={{ position: 'absolute' }}/>
		</div>
	);
}

export default function ResultOrEarth({ id, info }) {
	const target = useRef(null);
	const [traces, setTraces] = useState({});
	const [width, setWidth] = useState(0);
	const height = width * 3 / 4;
	useLayoutEffect(() => {
		setWidth(target.current.offsetWidth);
	 }, [target]);
	useResizeObserver(target, (entry) => setWidth(entry.contentRect.width));

	function spawnTrace(rigidity) {
		if (traces[id]?.includes(rigidity)) return;
		const newList = traces[id]
			? [...(traces[id].length < MAX_TRACES ? traces[id] : traces[id].slice(0, -1)), rigidity]
			: [rigidity];
		setTraces({ ...traces, [id]: newList });
	}
	const removeTrace = useCallback((tid, rigidity) => {
		setTraces(tr => ({ ...tr, [tid]: tr[tid]?.filter(r => r !== rigidity) }));
	}, []);
	const showTraces = traces[id] || [];
	const isDone = ['done', 'failed cones'].includes(info?.state);
	return (
		<>
			<div className='Result'>
				{isDone && <ResultText {...{ id, info }}/>}
				{isDone && <ResultCones {...{ id, info }}/>}
			</div>
			<div className='EarthAndPenumbra'>
				<div ref={target} className='Earth' style={{ height, position: 'relative' }}>
					<Earth {...{ width, height, id, info, removeTrace, traces: showTraces }}/>
				</div>
				{isDone && <ResultPenumbra {...{ id, width, traces: showTraces, callback: spawnTrace }}/>}
			</div>
		</>
	);

}