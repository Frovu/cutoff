const canvas_el = document.getElementById("earth");	//$("#earth")[0]
const context = canvas_el.getContext("experimental-webgl", {preserveDrawingBuffer: true});
const texture = 'earth.jpg';
const grid_color = 0x404040;
const grid_size = 30;
let camera, scene, renderer;
let controls;
let fps;

fitToContainer();

window.addEventListener('resize', function(event){
	resize();
});

function resize () {
	canvas_el.style.width ='100%';
	canvas_el.style.height ='60%';
	let width = canvas_el.clientWidth;
    let height = canvas_el.clientHeight;
    if (canvas_el.width != width || canvas_el.height != height) {
    	canvas_el.width = width;
     	canvas_el.height = height;
    	//animate();
    }
}


function fitToContainer(canvas) {
  // Make it visually fill the positioned parent
  canvas_el.style.width ='70%';

  // ...then set the internal size to match
  resize();

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
	earthMesh.rotation.x = (23.44 / 2) * (Math.PI/180);
	earthMesh.rotation.y = 0;
	earthMesh.rotation.z = (-23.44) * (Math.PI/180);
	camera.up = new THREE.Vector3(0, 1, 0);
	camera.position.z = 9;
	camera.position.y = 5;
	camera.lookAt(new THREE.Vector3(0, 0, 0));
	scene.add(earthMesh);
	renderer = new THREE.WebGLRenderer( { canvas: earth, preserveDrawingBuffer: true } );	// what is preserveDrawingBuffer ?
	renderer.setSize(width, height);
	controls = new THREE.OrbitControls(camera, renderer.domElement)
}

let then = 0;
function render(now) {
	now *= 0.001; // convert to seconds

	context.viewport(0, 0, context.canvas.width, context.canvas.height);
	if (!isNaN($("#cameraSpeed").val()))
		controls.autoRotateSpeed = $("#cameraSpeed").val() / 6.0;
    renderer.render(scene, camera);
	controls.update();
	record_gif ();

  	const deltaTime = now - then;          // compute time since last frame
  	then = now;                            // remember time for next frame
  	fps = 1 / deltaTime;             // compute frames per second
  	fps.toFixed(1);  // update fps display
  	requestAnimationFrame(render);
}

function drawGrid () {
    for (let x = 0; x <= grid_size; x++) {
        drawLine(x-grid_size/2, 0, -grid_size/2, x-grid_size/2, 0, grid_size/2, grid_color);
    }
    for (let z = 0; z <= grid_size; z++) {
        drawLine(-grid_size/2, 0, z-grid_size/2, grid_size/2, 0, z-grid_size/2, grid_color);
    }
}

init();
drawGrid();
render();
