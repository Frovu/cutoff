const particles_limit = 10000;
let valueranges;
const params = ['date', 'time', 'kp', 'swdp', 'dst', 'imfBy', 'imfBz', 'g1', 'g2', 'g3',
'model', 'alt', 'lat', 'lon', 'vertical', 'azimutal', 'lower', 'upper',
'step', 'flightTime'];

fetch_JSON(function(response) {
    valueranges = response;
 }, "valueranges.json");

change_step (0.1);

function submit () {
    if (is_bad_input()) return;
    $("#instance_modal").modal('hide');
    create_instance(get_settings_JSON());
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
    if(value == "")
        return true;
    if(param == "date")
        return !is_valid_date(value);
    if(param == "time")
        return !is_valid_time(value);

    if(param != "model" && param != "step") {
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
                feedback.innerHTML = "Correct format: YYYY-MM-DD";
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

function get_settings_JSON () {
    let settings = {};
    params.forEach(param => {
        const el = document.getElementById(param);
		if (param == "step") {
			settings[param] = parseFloat(parse_sentence_for_number(el.innerHTML));
		} else if (param == "model") {
			settings[param] = get_model_by_name(el.innerHTML).id;
		} else if (param == "date") {
        } else if (param == "time") {
            const d = new Date(`${document.getElementById("date").value}T${el.value}`);
            settings.datetime = d - d.getTimezoneOffset()*60000;
        } else {
			settings[param] = el.value;
		}
    });

    settings.name = document.getElementById("name").value;

	return JSON.stringify(settings);
}

// Validates that the input string is a valid date formatted as "mm/dd/yyyy"
function is_valid_date(date_string) {
    if(!/^\d{4}-\d{1,2}-\d{1,2}$/.test(date_string))
        return false;
    return Date.parse(date_string);
};

function is_valid_time(time_string) {
    const t = time_string.match(/^\d{1,2}\:\d{1,2}\:\d{1,2}$/);
    return !t || Date.parse('1970-01-01T' + time_string)
};

function parse_sentence_for_number(sentence){
   var matches = sentence.match(/(\+|-)?((\d+(\.\d+)?)|(\.\d+))/);
   return matches && matches[0] || null;
}
