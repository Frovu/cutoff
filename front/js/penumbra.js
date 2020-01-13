const canvas = $('#penumbra')[0];
const forbiddenColor = 'black';
const allowedColor = 'gray';
const ctx = canvas.getContext("2d");

let click_x = -1;
let click_y = -1;
let cursor_present;
let peeked_energy;
let active = false;
let energy_per_line;

function change_energy (value) {
    if (painter > 0) return;
    value = parseFloat(float_to_step_precision(parseFloat(value))); // fixing floating number issues, check without parsefloat's later
	value = settings.step*Math.round(value/settings.step);
	value = float_to_step_precision(value);

    if (value < settings.lower || value >= settings.upper || isNaN(value)) {
        console.log("error")
        return;
    }
    update_settings ();
    settings.energy = value;
    document.getElementById('energy').value = settings.energy;
    drawPenumbra ();
    fetch_trace(data.particles.findIndex(el => el[0] == settings.energy));
}

function peek_energy (value) {
    value = parseFloat(float_to_step_precision(parseFloat(value))); // fixing floating number issues, check without parsefloat's later
    if (value < settings.lower || value >= settings.upper || isNaN(value)) {
        return;
    }
    peeked_energy = value;
    drawPenumbra ();
}

canvas.addEventListener('click', function(event) {
    if (!active) return;
    const mouse_pos = get_canvas_mouse_pos(canvas);
    const clicked_energy = Math.floor(mouse_pos[0])/ctx.lineWidth*settings.step*energy_per_line + parseFloat(settings.lower);
    change_energy(clicked_energy);
}, false);

canvas.addEventListener('mousemove', function(event) {
    if (!active) return;
    cursor_present = true;
    const mouse_pos = get_canvas_mouse_pos(canvas);
    const peeked_energy = Math.floor(mouse_pos[0])/ctx.lineWidth*settings.step*energy_per_line + parseFloat(settings.lower);
    peek_energy(peeked_energy);
}, false);

canvas.addEventListener('mouseout', function(event) {
    if (!active) return;
    cursor_present = false;
    drawPenumbra();
}, false);

window.addEventListener('keydown', function(event) {
    if (event.keyCode == 'A' || event.keyCode == 37) {   // left
        const new_energy = parseFloat(settings.energy)-parseFloat(settings.step);
        change_energy(new_energy);
    }

    if (event.keyCode == 'D' || event.keyCode == 39) {   // right
        const new_energy = parseFloat(settings.energy)+parseFloat(settings.step);
        change_energy(new_energy)
    }
}, false);

function energy_equals (a, b) {
    a = energy_per_line*settings.step*Math.round(a/settings.step/energy_per_line);
    b = energy_per_line*settings.step*Math.round(b/settings.step/energy_per_line);
    return a == b;
}

function drawPenumbra () {
    active = true;
	ctx.clearRect(0, 0, canvas.width, canvas.height);

    let lineWidth = 1;
    if (data.particles.length >= 800) lineWidth = 1;
    if (data.particles.length < 800 && data.particles.length > 200) lineWidth = 2;
	if (data.particles.length <= 200) lineWidth = 4;


	canvas.width = canvas.style.width = data.particles.length * lineWidth > 800 ? 800 : data.particles.length * lineWidth + 70;
    ctx.lineWidth = lineWidth;

        /*
    console.log(data.particles.length + " * " + ctx.lineWidth + " + 70 = " + (data.particles.length * ctx.lineWidth + 70));
    console.log(data.particles.length > 800 ? 800 : data.particles.length * ctx.lineWidth + 70);*/
    //canvas.width = data.particles.length * ctx.lineWidth + 60;

    ctx.fillStyle = 'white';
    ctx.rect(0, 37, data.particles.length * ctx.lineWidth, 46);
    ctx.fill();
    energy_per_line = data.particles.length / canvas.width;
    if (energy_per_line < 1.0) energy_per_line = 1.0;
	for (let i = 0; energy_per_line > 1.0 ? i < canvas.width : i < data.particles.length; i++) {
        const particle_id = Math.round(energy_per_line * i);
        const energy = data.particles[particle_id][0]; // alpha version of energy pick
		ctx.beginPath();
		// + 0.5 - фикс странной системы коорднат
		ctx.moveTo(i * ctx.lineWidth + 1, 80);
        let height = 30;
        if (energy_equals(energy, data.lower) || energy_equals(energy, data.upper)) height = 40;
        if (energy_equals(energy, data.effective)) height = 40;
        //if (energy == settings.energy || energy == peeked_energy) height = 50;
        if (energy_equals(energy, settings.energy) || (energy_equals(energy, peeked_energy) && cursor_present)) height = 43;
		ctx.lineTo(i * ctx.lineWidth + 1, 80-height);

        ctx.strokeStyle = (data.particles[particle_id][1] == 0 ? allowedColor : forbiddenColor);
	    ctx.stroke();
	}

    ctx.font = "16px Times New Roman";
    ctx.fillText(settings.lower + "GV", 0, 100);
    ctx.fillText(settings.upper + "GV", data.particles.length * lineWidth-50, 100);

    ctx.fillText("lower: " + data.lower + "GV   " + "upper: " + data.upper + "GV    " + "effective: " + data.effective + "GV", 0, 120);
    ctx.fillText(settings.energy + "GV", Math.ceil(float_to_step_precision (settings.energy-settings.lower) / settings.step) / energy_per_line * ctx.lineWidth+8, 30);
    ctx.fillStyle = 'gray';
    if (cursor_present) ctx.fillText(peeked_energy + "GV", Math.ceil(float_to_step_precision (peeked_energy-settings.lower) / settings.step) / energy_per_line * ctx.lineWidth+8, 30);

    //ctx.font = "30px Arial";
    //ctx.fillText("Hello World", 10, 50);
}
