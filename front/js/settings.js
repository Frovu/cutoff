const particles_limit = 10000;
let settings = {};
let valueranges;
const params = ['date', 'time', 'swdp', 'dst', 'imfBy', 'imfBz', 'g1', 'g2',
'kp', 'model', 'alt', 'lat', 'lon', 'vertical', 'azimutal', 'lower', 'upper',
'step', 'flightTime'];

fetch_JSON(function(response) {
    valueranges = response;
 }, "valueranges.json");


change_step (0.1);

function submit () {
    if (is_bad_input()) return;
    if ((settings.upper - settings.lower)/settings.step > particles_limit) {
        alert("Entered data is too large for the server to"+
        " calculate it properly.\nMaximum amount of particles is " + particles_limit+
        "\nEntered amount is " + (settings.upper - settings.lower)/settings.step + ".");
        return;
    }

    $("#instance_modal").modal('hide');
    fetch_new_instance(get_settings_JSON());
}

// probably not neccesary
function set_settings (s) {
    settings = {};
    settings.lower = parseFloat(s.lower);
    settings.upper = parseFloat(s.upper);
    settings.step = parseFloat(s.step);
    settings.energy = parseFloat(s.lower);

    settings.altitude = parseFloat(s.alt);
    settings.longitude = parseFloat(s.lon);
    settings.latitude = parseFloat(s.lat);
    settings.station = isStation(settings.latitude, settings.longitude);

    settings.model = get_model_by_id(s.model).name;

    settings.dublicate = function dublicate() {
        // js doesn't really have some sort of a method to copy objects, so we have to do it ourselves
        // also settings.clone "is not a function" so i had to rename it to "dublicate" (probably jquery's fault)
        settings_clone = {};
        settings_clone.lower = settings.lower;
        settings_clone.upper = settings.upper;
        settings_clone.step = settings.step;
        settings_clone.energy = settings.energy;
    
        settings_clone.longitude = settings.longitude;
        settings_clone.latitude = settings.latitude;
        settings_clone.station = settings.station;
        settings_clone.altitude = settings.altitude;

        settings_clone.model = settings.model;
        return settings_clone;
    }

    limit_energy_input ();
}

function limit_energy_input () {
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

function change_step (value) {
    const float = parseFloat(value);
    let text;
    // workaround
    if (!isNaN(float)) text = "Step: " + float + " GV";
	else text = "Step: " + parse_sentence_for_number(value) + " GV";
    document.getElementById("step").innerHTML = text;
}

function change_energy (value) {
    if (value < settings.lower || value > settings.upper || isNaN(value)) {
        console.log("invalid energy")
        return;
    }
    settings.energy = parseFloat(value);
    document.getElementById('energy').value = settings.energy;
    fetch_trace(settings.energy);
    document.getElementById("trace-spinner").style = "visibility:visible;";
}

function get_settings_JSON () {
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

	return JSON.stringify(object);
}
