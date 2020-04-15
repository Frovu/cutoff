const particles_limit = 10000;
let settings = {};
let first_start_occured = false;
let valueranges;
const params = ['date', 'time', 'swdp', 'dst', 'imfBy', 'imfBz', 'g1', 'g2',
'kp', 'model', 'alt', 'lat', 'lon', 'vertical', 'azimutal', 'lower', 'upper',
'step', 'flightTime'];

loadJSON(function(response) {
  // Parse JSON string into object
    valueranges = JSON.parse(response);
 }, "valueranges.json");

init_input_events();

change_step ("0.1 GV");

function init_input_events () {
     params.forEach (function (param) {
        const el = document.getElementById(param);
        el.oninput = function() {
            settings_changed ();
            return;
        };
    });
}

function settings_changed () {
    if (!first_start_occured) return;
    const progress = document.getElementById('progress');
    progress.classList.add("bg-warning");
    progress.innerHTML = "Unsaved changes";
}

function submit () {
    if (processing) {
        cancel();
        return;
    }
    if (is_bad_input()) {
        return;
    }
    if (!first_start_occured) first_start_occured = true;
    if ((settings.upper - settings.lower)/settings.step > particles_limit) {
        alert("Entered data is too large for the server to"+
        " calculate it properly.\nMaximum amount of traces is " + particles_limit+
        "\nEntered amount is " + (settings.upper - settings.lower)/settings.step + ".");
        return;
    }
    start_process ();
    fetch_uid(json());
}

function update_settings () {
    settings = {};
    settings.lower = parseFloat(document.getElementById('lower').value);
    settings.upper = parseFloat(document.getElementById('upper').value);
    settings.step = parseFloat(parse_sentence_for_number(document.getElementById('step').innerHTML)) + "";
    settings.energy = parseFloat(settings.lower);

    settings.longitude = parseFloat(document.getElementById('lon').value);
    settings.latitude = parseFloat(document.getElementById('lat').value);
	settings.station = isStation(settings.latitude, settings.longitude); 
    settings.altitude = parseFloat(document.getElementById('alt').value);
    limit_energy ();    // maybe not neccesary?
}

// js doesn't really have some sort of a method to copy objects, so we have to do it ourselves
function clone_settings () {
    settings_clone = {};
    settings_clone.lower = settings.lower;
    settings_clone.upper = settings.upper;
    settings_clone.step = settings.step;
    settings_clone.energy = settings.energy;

    settings_clone.longitude = settings.longitude;
    settings_clone.latitude = settings.latitude;
    settings_clone.station = settings.station; 
    settings_clone.altitude = settings.altitude;
    return settings_clone;
}

function limit_energy () {
    const energy_el = document.getElementById('energy');
    energy_el.value = settings.energy;
    energy_el.setAttribute("min", settings.lower);
    energy_el.setAttribute("max", settings.upper);
    energy_el.setAttribute("step", settings.step);
}

function is_bad_value (param, value) {
    const el = document.getElementById(param);

    value = value.replace(/\s/g, ''); // removing spaces
    if (value == "") {
        return true;
    }

    if (param == "date") {
        return !is_valid_date(value);
    }

    if (param == "time") {
        return !is_valid_time(value);
    } 

    if (param != "model" && param != "step") {
        // if param is numeric, then we check it for having any letters
        if (!/^-?\d*\.?\d*$/.test(value)) {
            console.log("numerical test fail");
            return true;
        }

        // and then we check it's range
        value = parseFloat(value);
        if (value < valueranges[param].min || value > valueranges[param].max) {
            return true;
        }
    }

    return false;
}

function is_bad_input() {
    let bad = false;

    remove_elements_by_class("invalid-feedback");

    params.forEach (function (param) {
        const el = document.getElementById(param);
        const value = el.innerHTML != '' ? el.innerHTML : el.value;
        if (el.classList.contains('is-invalid')) {
            el.classList.remove('is-invalid');

        }
        if (is_bad_value (param, value)) {
            const feedback = document.createElement('div');
            feedback.className = "invalid-feedback";
            if (param == "time") {
                feedback.innerHTML = "Correct format: HH:MM:SS";
            } else if (param == "date") {
                feedback.innerHTML = "Correct format: YYYY.MM.DD";
            } else {
                feedback.innerHTML = "Correct range: " + valueranges[param].min + " to " + valueranges[param].max;
            }
            
            el.parentNode.appendChild(feedback);
            el.classList.add('is-invalid');
            bad = true;
        }
    });

    if (parseFloat(document.getElementById('upper').value) - parseFloat(document.getElementById('lower').value) <= 0) {
        document.getElementById('upper').classList.add('is-invalid');
        const feedback = document.createElement('div');
        feedback.className = "invalid-feedback";
        feedback.innerHTML = "Highest rigidity can't be less than or equal to lowest rigidity";
        document.getElementById('upper').parentNode.appendChild(feedback);
        bad = true;
    }
    return bad;
}

function change_step (value) {  // rename to change_step_unput
	document.getElementById("step").innerHTML = "Step: " + value;
    settings_changed ();
}

function change_energy (value) {
    if (value < settings.lower || value >= settings.upper || isNaN(value)) {
        console.log("invalid energy")
        return;
    }
    settings.energy = value;
    document.getElementById('energy').value = settings.energy;
    fetch_trace(data.particles.findIndex(el => el[0] == settings.energy));  // bad way of doing this, just use step multiplication
}

function json () {
    let object = {};
    params.forEach (function (param) {
        const el = document.getElementById(param);
		if (param == "step") {
			object[param] = parseFloat(parse_sentence_for_number(el.innerHTML));
		} else if (param == "model") {
			object[param] = get_model_by_name(el.innerHTML).id;
		} else if (param == "date") {
            object[param] = front_to_back_date(el.value);
        } else if (param == "time") {
            // handle . and :
            object[param] = front_to_back_time(el.value);
        }
		else {
			object[param] = el.value;
		}
    });

    object.trace = '1';
	return JSON.stringify(object);
}
