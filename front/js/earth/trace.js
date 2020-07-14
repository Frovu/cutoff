const max_traces = 6;
const colors = ['#ffffff', '#ffd966', '#ff4d67', '#8efc69', '#71f4f4', '#8f7fff'];
const update_interval_ms = 200;
let current_trace;
let traces = [];
let timeouts = [];

function Trace (penumbra, energy, color, mesh, time) {
    this.penumbra = penumbra;
    this.energy = energy;
    this.color = color;
    this.mesh = mesh;
    this.time = time;
}

async function fetch_trace (penumbra, energy) {
    start_spinner();

    const response = await fetch('instance/' + penumbra.id + "/" + energy, {
        method: 'GET',
        headers: { "Content-Type": "application/json" },
    }).catch ((error) => {
        show_error(error);
    });;

    if (response != undefined) {
        if (response.ok) {
        	stop_spinner();
            const data = await response.json();
            add_trace(penumbra, energy, data);
        } else {
            switch (response.status) {
                case 102: // processing
                    setTimeout(function (){
                        fetch_trace(energy);
                    }, update_interval_ms);
                    break;
                case 500:
                    show_error("Trace failed to calculate");
                    stop_spinner();
                    break;
                case 404:
                	show_error("Trace or instance not found");
                	stop_spinner();
                	break;
                default:
                    show_error(response.status);
                    stop_spinner();
                    break;
            }
        }
    } else {
        show_error("Server didn't respond");
        stop_spinner();
    }
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

function add_trace (penumbra, energy, data) {
	if (traces.length > max_traces-1) return;
	stop_timeouts();

	const color = get_free_color();
	const step = 1;
	const interval_ms = (data[data.length-1][0] * 1000.0) / data.length * step;

	const line = get_line_mesh(
		-data[0][1], data[0][3], data[0][2],
		-data[1][1], data[1][3], data[1][2], color
	);

	const time = data[data.length-1][0];
	const trace = new Trace(penumbra, energy, color, line, time);
	scene.add(trace.mesh);
	traces.push(trace);
	current_trace = trace;

	update_info();
	draw_penumbra(penumbra);

	for (let i = step; i < data.length; i+=step) {
		timeouts[i] = setTimeout(function () {
  			draw_trace_frame(data, step, i, color);
  		}, (i/step+1)*interval_ms);
	}
}

function start_spinner () {
    document.getElementById("trace-spinner").style = "visibility:visible;";
}

function stop_spinner () {
    document.getElementById("trace-spinner").style = "visibility:hidden;";
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
	const trace = traces[index];
	if (trace == current_trace) {
		stop_timeouts(trace)
	}
	scene.remove(trace.mesh);
	traces.splice(index, 1);
	draw_penumbra(trace.penumbra);
	update_info();
}

// we need to do some preparations of settings data (set model and station)
function update_info () {
	const info = document.getElementById('info');
	info.innerHTML = '';

	for (let i = 0; i < traces.length; i++) {
		let trace = traces[i];
		const s = trace.penumbra.settings;
		const station = isStation(s.lat, s.lon);
		const location = station ? station : "Lat: " + s.lat + "; Lon: " + s.lon;
		const altitude = s.alt + " km";
		const energy = trace.energy + " GV";
		const time = trace.time + " sec";
		const model = get_model_by_id(s.model).name;
		info.innerHTML += `<a onclick='delete_trace(${i})'>[ X ]</a>  <span style='color: ${trace.color}'> ${model}<br>${location}, ${altitude}<br>${energy}<br>${time}</span>`;
		info.innerHTML += '<br><br>';
	}

	if (traces.length > 1) info.innerHTML += "<a onclick='delete_all_traces()'>[ Clear ]";
}
