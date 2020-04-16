const max_traces = 6;
let current_trace;
let traces = [];
let timeouts = [];
const colors = ['#ffffff', '#ffd966', '#ff4d67', '#8efc69', '#71f4f4', '#8f7fff'];

function Trace (settings, color, mesh, time) {
    this.settings = settings;
    this.color = color;
    this.mesh = mesh;
    this.time = time;
}

function get_free_color () {
	for (let j = 0; j < colors.length; j++) {
		let free = false;
		for (let i = 0; i < traces.length; i++) {
			if (traces[i].color == colors[j]) {
				free = false;
				break;
			} else {
				free = true;
			}
		}
		if (free) return colors[j];
	}
	return "#ffffff";
}

function start_trace (trace_data) {
	if (traces.length > max_traces-1) return;

	const color = get_free_color();
	stop_timeouts();

	let step = 4;
	const interval_ms = (trace_data[trace_data.length-1][0] * 1000.0) / trace_data.length * step;	// = real flight time in ms / total segments

	const line = get_line_mesh(
		-trace_data[0][1], trace_data[0][3], trace_data[0][2],
		-trace_data[1][1], trace_data[1][3], trace_data[1][2], color
	);

	const settings_clone = clone_settings ();


	const time = trace_data[trace_data.length-1][0];
	const trace = new Trace(settings_clone, color, line, time);
	scene.add(trace.mesh);
	traces.push(trace);
	current_trace = trace;

	update_info();

	for (let i = step; i < trace_data.length; i+=step) {
		timeouts[i] = setTimeout(function draw() {
  			draw_trace_frame(trace_data, step, i, color);	// trace_id?
  		}, (i/step+1)*interval_ms);
	}
}

function stop_timeouts () {
	console.log("stopping timeouts...");
	// removing from the end of array with pop() for performance
	for (let i = timeouts.length-1; i >= 0; i--) {
		clearTimeout(timeouts[i]);
		timeouts.pop();
	}
}

function draw_trace_frame (trace_data, step, i, color) {
	const line = get_line_mesh(
		-trace_data[i-step][1], trace_data[i-step][3], trace_data[i-step][2],
		-trace_data[i][1], trace_data[i][3], trace_data[i][2], color
	);

	scene.remove(current_trace.mesh);	// remove old trace from scene
	const mesh = merged(current_trace.mesh, line, color);
	current_trace.mesh = mesh;
	scene.add(mesh);	// add new trace to scene
}

function merged (a, b, color) {
	const singleGeometry = new THREE.Geometry();
	if (a != undefined) {
		a.updateMatrix();
		singleGeometry.merge(a.geometry, a.matrix);
	}
	if (b != undefined) {
		b.updateMatrix();
		singleGeometry.merge(b.geometry, b.matrix);
	}

	const material = new THREE.LineBasicMaterial ( {color: color} );
 	const mesh = new THREE.Line (singleGeometry, material);
	return mesh;
}

function delete_all_traces () {
	for (let i = traces.length-1; i >= 0; i--) {
		delete_trace(i);
	}
}

function delete_trace (index) {
	if (traces[index] == current_trace) {
		stop_timeouts(traces[index])
	}
	console.log("deleting trace " + index)
	scene.remove(traces[index].mesh);
	traces.splice(index, 1);
	update_info();
	draw_penumbra();
}

function update_info () {
	const info = document.getElementById('info');
	info.innerHTML = '';
	for (let i = 0; i < traces.length; i++) {
		let trace = traces[i];
		const location = trace.settings.station ? trace.settings.station : "LAT: " + trace.settings.latitude + "; LON: " + trace.settings.longitude;
		const altitude = trace.settings.altitude + " km";
		const energy = trace.settings.energy + " GV";
		const time = trace.time + " sec";
		info.innerHTML += "<a onclick='delete_trace("+i+")'>[ X ]</a>  <span style='color: "+trace.color+"'> " + location + ", " + altitude + "<br>" + energy + "<br>" + time +"</span>";
		info.innerHTML += '<br><br>';
	}
	if (traces.length > 1) info.innerHTML += "<a onclick='delete_all_traces()'>[ Clear ]";
}
