import { useState, useEffect } from 'react';
import { useMutation, useQuery, QueryClient, QueryClientProvider } from 'react-query';
import './css/App.css';
import Settings, { findStation, MODEL_NAME } from './Settings.js';

const queryClient = new QueryClient();

function InstanceCard({ id, info, setError }) {
	const sets = info.settings;
	const [ state, setState ] = useState(info.state);
	const progress = useQuery([id], async () => {
		const res = await fetch(process.env.REACT_APP_API + 'api/instance/' + id, { credentials: 'include' });
		if (res.status !== 200)
			return;
		const resp = await res.json();
		console.log(id, resp);
		if (resp.state !== 'processing')
			setState(resp.state);
		return resp;
	}, {
		enabled: state === 'processing',
		refetchInterval: 1000
	});
	const deleteMutation = useMutation(async () => {
		const res = await fetch(process.env.REACT_APP_API + 'api/instance/' + id + '/delete', {
			method: 'POST',
			credentials: 'include'
		});
		if (res.status !== 200)
			return `HTTP: ${res.status}`;
	}, {
		onError: (err) => setError(err.message),
		onSuccess: (data) => {
			if (data)
				return setError(data);
			queryClient.invalidateQueries(['instances']);
		}
	});

	const station = findStation(sets.lat, sets.lon);
	const date = new Date(sets.datetime * 1e3).toISOString().split('T')[0];
	return (
		<div className='InstanceCard'>
			<span className='CloseButton' style={{ position: 'absolute', right: '4px', top: '-3px', fontSize: '20px' }}
				onClick={deleteMutation.mutate}>&times;</span>
			<span>{station || `(${sets.lat.toFixed(2)},${sets.lon.toFixed(2)})`}, {MODEL_NAME[sets.model]}, {date}</span>
			<div style={{
				height: '4px', width: (state === 'processing' ? (progress.data?.progress ?? .33) * 100 : 100) + '%', margin: '4px 0 2px 0',
				backgroundColor: state === 'processing' ? 'var(--color-active)' : (state === 'done' ? '#0f5' : 'red')
			}}></div>
			<div style={{ textAlign: 'right' }}>{state === 'processing' ? `=${progress.data?.progress ?? '??'}%` : state}</div>
		</div>
	);
}

async function spawnInstance(settings) {
	const res = await fetch(process.env.REACT_APP_API + 'api/instance', {
		method: 'POST',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ settings })
	});
	const resp = await res.json().catch(console.log);
	if (res.status !== 200)
		return { error: resp?.error ? `${res.status}: ${resp.error}`: `HTTP: ${res.status}` };
	return { id: resp.id };
}

function App() {
	const [error, setError] = useState();
	useEffect(() => {
		const timeout = setTimeout(() => setError(null), 3000);
		return () => clearTimeout(timeout);
	}, [error]);

	const spawnMutation = useMutation(spawnInstance, {
		onError: (err) => setError(err.message),
		onSuccess: (data) => {
			if (data.error)
				return setError(data.error);
			queryClient.invalidateQueries(['instances']);
		}
	});

	const listQuery = useQuery(['instances'], () =>
		fetch(process.env.REACT_APP_API + 'api/instance', { credentials: 'include' }).then(res => res.json()));
	
	return (
		<div className='App'>
			<div className='LeftPanel'>
				<div className='Menu'>
					<b>Cutoff2050</b><br/>
					Geomagentic Calculator
				</div>
				{ listQuery.error && <div style={{ color: 'red' }}>{listQuery.error?.message}</div> }
				{ listQuery.data &&
					Object.entries(listQuery.data).map(([id, info]) => <InstanceCard key={id} {...{ id, info, setError }}/>)}
			</div>
			<div className='TopPanel'>
				<Settings callback={spawnMutation.mutate} setError={setError}/>
				<div style={{ margin: '1em', color: 'red' }}>
					{error}
				</div>
			</div>
			<div className='BottomPanel'>
				RESULT
			</div>
    
		</div>
	);
}

export default function AppWrapper() {
	return <QueryClientProvider client={queryClient}><App/></QueryClientProvider>;
}
