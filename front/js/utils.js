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

function float_to_step_precision (float) {
    return float.toFixed(decimalPlaces(settings.step));
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

 // Validates that the input string is a valid date formatted as "mm/dd/yyyy"
function is_valid_date(dateString)
{
    // First check for the pattern
    if(!/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(dateString))
        return false;

    // Parse the date parts to integers
    const parts = dateString.split(".");
    const day = parseInt(parts[2], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[0], 10);

    // Check the ranges of month and year
    if(year < 1900 || year > 2050 || month == 0 || month > 12) // using cutoff in year 1900 be like:
        return false;

    let monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];

    // Adjust for leap years
    if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
        monthLength[1] = 29;

    // Check the range of the day
    return day > 0 && day <= monthLength[month - 1];
};

function is_valid_time(timeString)
{
    // First check for the pattern
    if(!/^\d{1,2}\:\d{1,2}\:\d{1,2}$/.test(timeString))
        return false;

    // Parse the time parts to integers
    const parts = timeString.split(":");
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);

    // Check the ranges
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
        return false;
    }

    return true;
};

function front_to_back_time (timeString) {
    const parts = timeString.split(":");
    const hours = parts[0].padStart(2, "0");
    const minutes = parts[1].padStart(2, "0");
    const seconds = parts[2].padStart(2, "0");
    return hours + ":" + minutes + ":" + seconds;
}

function front_to_back_date (dateString) {
    const parts = dateString.split(".");
    const day = parts[2].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    const year = parts[0].padStart(2, "0");
    return day + "." + month + "." + year;
}

function parse_sentence_for_number(sentence){
    var matches = sentence.match(/(\+|-)?((\d+(\.\d+)?)|(\.\d+))/);
    return matches && matches[0] || null;
}

function remove_elements_by_class(className) {
    let elements = document.getElementsByClassName(className);
    while (elements.length > 0) {
        elements[0].parentNode.removeChild(elements[0]);
    }
}
