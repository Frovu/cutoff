function decimalPlaces(float) {
    if(Math.floor(float) === float) return 0;
    return float.toString().split(".")[1].length || 0;
}

function float_to_step_precision (float) {
    return parseFloat(float).toFixed(decimalPlaces(settings.step));
}

function on_map (lat, lon) {
    window.open("https://www.google.com/maps/search/?api=1&query="+lat+","+lon);
}

function get_canvas_mouse_pos (canvas) {
    const bounds = canvas.getBoundingClientRect();
    click_x = event.pageX - bounds.left - scrollX;
    click_y = event.pageY - bounds.top - scrollY;
    click_x = click_x / bounds.width * canvas.width;
    click_y = click_y / bounds.height * canvas.height;
    return [click_x, click_y];
}

function drawLine (x1, y1, z1, x2, y2, z2, color) {
    const line = get_line_mesh(x1, y1, z1, x2, y2, z2, color);
    scene.add(line);
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

function show_error (error) {
    let element = document.getElementById("error_alert");
    element.innerHTML = "ERROR: " + error;
    element.style["display"] = "inline-block";
}

// generates distinct random colors
// by stackoverflow
// [FIXME] NOT USED ANYMORE, USELESS
/*
function random_color(h)
{
    let f= (n,k=(n+h*12)%12) => .5-.5*Math.max(Math.min(k-3,9-k,1),-1);
    let rgb2hex = (r,g,b) => "#"+[r,g,b].map(x=>Math.round(x*255).toString(16).padStart(2,0)).join('');
    return ( rgb2hex(f(0), f(8), f(4)) );
}*/