const max_traces = 5;
let current_trace = -1;	//rename to drawing_trace_id, probably
let traces = [];
const colors = ['#ffffff', '#ffd319', '#e3424d', '#22ff22', '#46f0f0', '#8f7fff'];
let timeouts = [];

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
	if (traces.length >= max_traces-1) return;
	console.log("drawing trace " + current_trace);
	const color = get_free_color();
	stop_timeouts();
	current_trace ++;

	let step = 1;
	const interval_ms = (trace_data[trace_data.length-1][0] * 1000.0) / trace_data.length * step;	// = real flight time in ms / total segments

	for (let i = step; i < trace_data.length; i++) {
		timeouts[i] = setTimeout(function draw() {
  			draw_trace_frame(trace_data, step, i, color);	// trace_id?
  		}, (i+1)*interval_ms);
	}
}

function stop_timeouts () {
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

	// previous frame of an animation is an old trace.
	// current frame of an animation is an old trace + a small new segment.
	if (i == step) {
		// first step: creating initial animation frame
		const time = trace_data[trace_data.length-1][0];
		const trace = new Trace(settings, color, line, time);
		scene.add(trace.mesh);
		traces.push(trace);
		updateInfo();
	} else {
		scene.remove(traces[current_trace].mesh);	// remove old trace from scene
		const mesh = merged(traces[current_trace].mesh, line, color);
		traces[current_trace].mesh = mesh;
		scene.add(mesh);	// add new trace to scene
	}
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
	for (let i = 0; i < traces.length; i++) {
		delete_trace(traces[i]);
	}
}

function delete_trace (index) {
	console.log("deleting trace " + index)
	scene.remove(traces[index].mesh);
	traces.splice(index, 1);
	if (index == current_trace && painter != undefined) {
		painter = 0;
		clearTimeout(painter);
	}
	current_trace --;
	updateInfo();
}

function updateInfo () {
	const info = document.getElementById('info');
	info.innerHTML = '';
	for (let i = 0; i < traces.length; i++) {
		let trace = traces[i];
		const location = trace.settings.station ? trace.settings.station : trace.settings.latitude + ", " + trace.settings.longitude;
		const altitude = trace.settings.altitude + " km";
		const energy = trace.settings.energy + " GV";
		const time = trace.time + " seconds";
		info.innerHTML += "<a onclick='delete_trace("+i+")'>[ X ]</a>  <span style='color: "+trace.color+"'> " + location + "<br>" + altitude + "<br>" + energy + "<br>" + time +"</span>";
		info.innerHTML += '<br><br>';
	}
}
