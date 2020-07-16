function get_canvas_mouse_pos (canvas) {
    const bounds = canvas.getBoundingClientRect();
    click_x = event.pageX - bounds.left - scrollX;
    click_y = event.pageY - bounds.top - scrollY;
    click_x = click_x / bounds.width * canvas.width;
    click_y = click_y / bounds.height * canvas.height;
    return [click_x, click_y];
}

function decimalPlaces(float) {
    if(Math.floor(float) === float) return 0;
    return float.toString().split(".")[1].length || 0;  //some bug with , ?
}

function float_to_step_precision (float, step) {
    return float.toFixed(decimalPlaces(step));
}

function on_map (lat, lon) {
    window.open("https://www.google.com/maps/search/?api=1&query="+lat+","+lon);
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


// some jquery handler to hide bootstrap alert element instead of deleting it when using dismiss button
$(".close").on("click", function(e)
{
    $("#error_alert").hide();
});


function show_error (error) {
    stop_spinner();

    const alert_element = document.getElementById("error_alert");
    alert_element.style["display"] = "inline-block";

    const alert_text_element = document.getElementById("error_text");
    alert_text_element.innerHTML = "<strong>ERROR:</strong> " + error;

    console.error(error);
}

function remove_elements_by_class(className) {
    let elements = document.getElementsByClassName(className);
    while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
    }
}

async function fetch_JSON (callback, path) {
    const response = await fetch(path, {
        method: 'GET',
        headers: { "Content-Type": "application/json" },
    }).catch ((error) => {
        show_error(error);
    });;

    if (response != undefined) {
        if (response.ok) {
            const json = await response.json();
            callback(json);
        } else {
            show_error("Failed loading JSON: HTTP " + response.status);
        }
    } else {
        show_error(path + " didn't found on server");
    }
}

// value normalization
function normalize (value, min, max) {
    return max === min ? 0 : (value - min) / (max - min);
}
