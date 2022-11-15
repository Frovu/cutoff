import { useState, useEffect } from 'react';
import { useMutation, useQuery, QueryClient, QueryClientProvider, useQueryClient } from 'react-query';
import './css/App.css';
import Settings, { findStation, MODEL_NAME } from './Settings.js';
import Result from './Result.js';

const theQueryClient = new QueryClient();

function InstanceCard({ id, info, active, setError, setActive }) {
	const queryClient = useQueryClient();
	const sets = info.settings, state = info.state;
	const progress = useQuery([id], async () => {
		const res = await fetch(process.env.REACT_APP_API + 'api/instance/' + id, { credentials: 'include' });
		if (res.status !== 200)
			return;
		const resp = await res.json();
		if (resp.state !== 'processing')
			queryClient.invalidateQueries({ queryKey: ['instances'] });
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
		return res.status === 200 ? '' : `HTTP: ${res.status}`;
	}, {
		onError: (err) => {
			queryClient.invalidateQueries();
			setError(err.message);
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ['instances'] });
			if (data)
				return setError(data);
		}
	});
	const station = findStation(sets.lat, sets.lon);
	const date = new Date(sets.datetime * 1e3).toISOString().split('T')[0];
	const percentage = progress.isLoading ? 0 : (progress.data?.progress != null ? (progress.data.progress * 100).toFixed(0) : null);
	return (
		<div className='InstanceCard' onClick={() => setActive(id)} style={{ ...(active && { color: 'var(--color-active)' }) }}>
			<span className='CloseButton' style={{ position: 'absolute', right: '4px', top: '-3px', fontSize: '20px' }}
				onClick={(e) => {e.stopPropagation(); deleteMutation.mutate();}}>&times;</span>
			<span>{station || `(${sets.lat.toFixed(2)},${sets.lon.toFixed(2)})`}, {MODEL_NAME[sets.model]}, {date}</span>
			<div style={{
				height: '4px', width: (state === 'processing' ? (percentage ?? 33) : 100) + '%', margin: '4px 0 2px 0',
				backgroundColor: state === 'processing' ? 'var(--color-active)' : (state === 'done' ? '#0f5' : 'red')
			}}></div>
			<div style={{ textAlign: 'right' }}>{state === 'processing' ? `=${percentage ?? '??'}%` : state}</div>
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
	const [activeInstance, setActive] = useState();
	const [error, setError] = useState();
	useEffect(() => {
		const timeout = setTimeout(() => setError(null), 3000);
		return () => clearTimeout(timeout);
	}, [error]);
	const queryClient = useQueryClient();
	const spawnMutation = useMutation(spawnInstance, {
		onError: (err) => {
			setError(err.message);
			queryClient.invalidateQueries();
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ['instances'] });
		}
	});
	useEffect(() => {
		if (!spawnMutation.data) return;
		console.log('effect', spawnMutation.data);
		setActive(spawnMutation.data.id);
		setError(spawnMutation.data.error);
	}, [spawnMutation.data]);

	const listQuery = useQuery(['instances'], async () => {
		const res = await fetch(process.env.REACT_APP_API + 'api/instance', { credentials: 'include' });
		return await res.json();
	});
	
	const activeInstanceInfo = listQuery.data?.[activeInstance];
	return (
		<div className='App'>
			<div className='LeftPanel'>
				<div className='Menu'>
					<b>Cutoff2050</b><br/>
					Geomagentic Calculator
				</div>
				{ listQuery.error && <div style={{ color: 'red', padding: '8px', borderBottom: '2px var(--color-border) solid' }}>{listQuery.error?.message}</div> }
				{ listQuery.data &&
					Object.entries(listQuery.data).map(([id, info]) =>
						<InstanceCard key={id} active={id === activeInstance} {...{ id, info, setActive, setError }}/>)}
			</div>
			<div className='TopPanel'>
				<Settings callback={spawnMutation.mutate} setError={setError} settings={activeInstanceInfo?.settings}/>
				<div style={{ margin: '1em', color: 'red' }}>
					{error}
				</div>
			</div>
			<div className='BottomPanel'>
				{activeInstanceInfo?.state === 'done' && <Result id={activeInstance} info={activeInstanceInfo}/>}
			</div>
		</div>
	);
}

export default function AppWrapper() {
	return <QueryClientProvider client={theQueryClient}><App/></QueryClientProvider>;
}
