const canvas_el = document.getElementById("earth");	//$("#earth")[0]
const context = canvas_el.getContext("experimental-webgl", {preserveDrawingBuffer: true});
const texture = 'earth.jpg';
const grid_color = 0x404040;
const grid_size = 30;
let camera, scene, renderer;
let controls;

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
		controls.autoRotateSpeed = $("#cameraSpeed").val() / 6.0;
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