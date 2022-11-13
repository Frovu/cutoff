import { useState, useEffect } from 'react';
import { useMutation, useQuery, QueryClient, QueryClientProvider } from 'react-query';
import './css/App.css';
import Settings from './Settings.js';

const queryClient = new QueryClient();

function InstanceList({ data }) {
	return (
		<div>{Object.keys(data).join()}</div>
	);
}

async function spawnInstance(settings) {
	const res = await fetch(process.env.REACT_APP_API + 'api/instance', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ settings })
	});
	const body = await res.json().catch(() => {});
	if (res.status !== 200)
		return { error: body?.error ? `${res.status}: ${body.error}`: `HTTP: ${res.status}` };
	return { id: body.id };
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
		fetch(process.env.REACT_APP_API + 'api/instance').then(res => res.json()));
	
	return (
		<div className='App'>
			<div className='LeftPanel'>
				<div className='Menu'>
					<b>Cutoff2050</b><br/>
					Geomagentic Calculator
				</div>
				{ listQuery.error && <div style={{ color: 'red' }}>{listQuery.error?.message}</div> }
				{ listQuery.data && <InstanceList data={listQuery.data}/>}
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
