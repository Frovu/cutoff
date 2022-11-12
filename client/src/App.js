import './css/App.css';
import Settings from './Settings.js';

function App() {
	return (
		<div className='App'>
			<div className='LeftPanel'>
				<div className='Menu'>
					<b>Cutoff2050</b><br/>
					Geomagentic Calculator
				</div>
				{/* <InstanceList/> */}
			</div>
			<div className='TopPanel'>
				<Settings/>
			</div>
			<div className='BottomPanel'>
				RESULT
			</div>
    
		</div>
	);
}

export default App;
