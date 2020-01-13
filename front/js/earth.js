const canvas_el = document.getElementById("earth");	//$("#earth")[0]
const context = canvas_el.getContext("experimental-webgl", {preserveDrawingBuffer: true});
const texture = 'earth.jpg';
const grid_color = 0x404040;
const grid_size = 30;
const max_traces = 5;

let camera, scene, renderer;
let traces = [];
const colors = ['#ffffff', '#ffd319', '#e3424d', '#22ff22', '#46f0f0', '#8f7fff'];
let current_trace = -1;
let controls;
let painter;

init();
drawGrid();
animate();

window.addEventListener('resize', function(event){
	resize();
});

function resize () {
	let width = canvas_el.clientWidth;
    let height = canvas_el.clientHeight;
    if (canvas_el.width != width || canvas_el.height != height) {
    	canvas_el.width = width;
     	canvas_el.height = height;
    	//animate();
    }
}

function init() {
	let width = canvas_el.width;
	let height = canvas_el.height;
	camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 500);
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0x000000);
	let ambientLight = new THREE.AmbientLight("#ffffff");
    scene.add(ambientLight);
	const earthGeometry = new THREE.SphereGeometry(1.0, 32, 32);
    const earthTexture = new THREE.TextureLoader().load(texture);
	earthTexture.wrapS = THREE.RepeatWrapping;
    const earthMaterial = new THREE.MeshLambertMaterial( { map: earthTexture } );
	const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
	// rotating the earth by some magic numbers so traces will be drawn as they should
	earthMesh.rotation.x = -0.165;
	earthMesh.rotation.y = -0.021;
	earthMesh.rotation.z = 0.425;
	camera.up = new THREE.Vector3(0, 1, 0);
	camera.position.z = 9;
	camera.position.y = 5;
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	scene.add(earthMesh);
	renderer = new THREE.WebGLRenderer( { canvas: earth, preserveDrawingBuffer: true } );	// what is preserveDrawingBuffer ?
	renderer.setSize(width, height);
	controls = new THREE.OrbitControls(camera, renderer.domElement)
}

function animate() {
	context.viewport(0, 0, context.canvas.width, context.canvas.height);
	requestAnimationFrame(animate);
	if (!isNaN($("#cameraSpeed").val()))
		controls.autoRotateSpeed = $("#cameraSpeed").val() / 4.0;
    renderer.render(scene, camera);
	controls.update();
	record_gif ();
}

function drawGrid () {
    for (let x = 0; x <= grid_size; x++) {
        drawLine(x-grid_size/2, 0, -grid_size/2, x-grid_size/2, 0, grid_size/2, grid_color);
    }
    for (let z = 0; z <= grid_size; z++) {
        drawLine(-grid_size/2, 0, z-grid_size/2, grid_size/2, 0, z-grid_size/2, grid_color);
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

function merged (a, b, color) {	// remove color variable
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

function get_line_mesh (x1, y1, z1, x2, y2, z2, color) {
	const material = new THREE.LineBasicMaterial({
    	color: color,
    });

    const geometry = new THREE.Geometry();
    geometry.vertices.push(
    	new THREE.Vector3(x1, y1, z1),
    	new THREE.Vector3(x2, y2, z2)
    );

    return new THREE.Line(geometry, material);
}

function drawLine (x1, y1, z1, x2, y2, z2, color) {
	const line = get_line_mesh(x1, y1, z1, x2, y2, z2, color);
	scene.add(line);
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
