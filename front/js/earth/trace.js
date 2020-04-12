const max_traces = 5;
let current_trace = -1;
let traces = [];
const colors = ['#ffffff', '#ffd319', '#e3424d', '#22ff22', '#46f0f0', '#8f7fff'];
let painter;

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

function draw_trace (trace_data) {
	if (current_trace >= max_traces-1) return;
	current_trace ++;
    const step = 3;
	const color = get_free_color();
	draw_trace_animated(trace_data, step, step, color);
}

function draw_trace_animated (trace_data, i, step, color) {
	painter = setTimeout(function(){
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
		} else {
			const mesh = merged(traces[current_trace].mesh, line, color);
			scene.remove(traces[current_trace].mesh);	// remove old trace from scene
			//traces[current_trace] = new Trace(traces[current_trace].settings, colors[current_trace], mesh);
			traces[current_trace].mesh = mesh;
			scene.add(traces[current_trace].mesh);	// add new trace to scene
		}

		if (i+step < trace_data.length)
			draw_trace_animated(trace_data, i+step, step, color);
		else
			painter = 0;
		if (i == step)
			updateInfo();
	}, 3);
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
