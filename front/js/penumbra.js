const canvas = $('#penumbra')[0];
const forbiddenColor = 'black';
const allowedColor = 'gray';
const ctx = canvas.getContext("2d");

let active = false;
let peek_energy;
let cursor_present = false;


canvas.addEventListener('click', function(event) {
    if (!active) return;
    change_energy(peek_energy);
    draw_penumbra();
}, false);

canvas.addEventListener('mousemove', function(event) {
    if (!active) return;
    cursor_present = true;
    const mouse_pos = get_canvas_mouse_pos(canvas);
    peek_energy = Math.floor(mouse_pos[0]-2.5)/5*settings.step + settings.lower;
    peek_energy = parseFloat(float_to_step_precision(parseFloat(peek_energy))); // fixing floating number issues, check without parsefloat's later
    if (peek_energy < settings.lower || peek_energy > settings.upper) return;
    draw_penumbra();
}, false);

canvas.addEventListener('mouseout', function(event) {
    if (!active) return;
    cursor_present = false;
    draw_penumbra();
}, false);

window.addEventListener('keydown', function(event) {
    if (document.hasFocus()) return;    // do not listen to arrow or AD keys when user is writing
    if (event.keyCode == 'A' || event.keyCode == 37) {   // left
        const new_energy = settings.energy-settings.step;
        change_energy(new_energy);
    }

    if (event.keyCode == 'D' || event.keyCode == 39) {   // right
        const new_energy = settings.energy+settings.step;
        change_energy(new_energy)
    }
}, false);


// maybe some function like update() to call draw_penumbra() and draw_time() at once? also handling "active" variable and etc.

function draw_penumbra () {
    if (!active) active = true; // maybe you can use first_start_occured instead? btw rename this variable
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = get_line_width();
    //canvas.width = canvas.style.width = data.particles.length * ctx.lineWidth > 800 ? 800 : data.particles.length * ctx.lineWidth + 70; // what?

    // temporary lack of support of big data
    //canvas.width = canvas.style.width = data.particles.length * ctx.lineWidth + 70; // this line sets ctx.lineWidth to 1, idk why
    canvas.width = canvas.style.width = data.particles.length * ctx.lineWidth > 800 ? 800 : data.particles.length * ctx.lineWidth; 
    ctx.lineWidth = get_line_width();

    ctx.fillStyle = 'white';
    ctx.rect(0, 47, data.particles.length * ctx.lineWidth, 140);
    ctx.fill();
    // temporary lack of support of big data
    //energy_per_line = data.particles.length / canvas.width;
    
    for (let i = 0; i < data.particles.length; i++) {
        const particle = data.particles[i];   // -1 offset. why? i don't know
        let height = 30;
        if (particle[0] == peek_energy && cursor_present) height = 30 + 55;
        if (particle[0] == settings.energy) height = 30 + 55;
        ctx.beginPath();
        ctx.moveTo(i * ctx.lineWidth+2.5, 50);          //50
        ctx.lineTo(i * ctx.lineWidth+2.5, 50+height);      //50+height
        //ctx.strokeStyle = (data.particles[particle_id][1] == 0 ? allowedColor : forbiddenColor);
        ctx.strokeStyle = (data.particles[i == 0 ? 0 : i-1][1] == 0 ? allowedColor : forbiddenColor);
        ctx.stroke();
    }

    ctx.font = "16px Times New Roman";
    // why is it so long? \/
    draw_text (settings.energy + "GV", Math.ceil(float_to_step_precision (settings.energy-settings.lower) / settings.step) * ctx.lineWidth, 40); 

    ctx.fillStyle = 'gray';
    if (cursor_present && peek_energy != settings.energy) {
        draw_text (peek_energy + "GV", Math.ceil(float_to_step_precision (peek_energy-settings.lower) / settings.step) * ctx.lineWidth , 40)
    }


    draw_time();
}

function draw_time () {
    ctx.lineWidth = 1;
    const height_multiplier = 5.0; // 5 for now; change it dynamically later (rely on maximum flight time)
    for (let i = 1; i < data.particles.length; i++) {
        //const particle_id = Math.round(energy_per_line * i);
        const height = data.particles[i][2] * height_multiplier;
        const old_height = data.particles[i-1][2] * height_multiplier;
        ctx.beginPath();
        ctx.moveTo(i * ctx.lineWidth * 5 - 2.5, 130-height);
        ctx.lineTo((i-1) * ctx.lineWidth * 5 - 2.5, 130-old_height);
        ctx.strokeStyle = "black";
        ctx.stroke();
    }
}

// draws any text in (x, y) and offsets x if it is outside canvas
function draw_text (text, x, y) {
    if (x > canvas.width - ctx.measureText(text).width) x -= ctx.measureText(text).width - 4;
    ctx.fillText(text, x, y);
}

function get_line_height (value) {
    // maybe?
}

function get_line_width () {
    /*
    if (data.particles.length >= 800) return 1;
    if (data.particles.length > 200 && data.particles.length < 800) return 2;
    if (data.particles.length <= 200) return 4;
    console.error("incorrect get_line_width() constraints");
    return 0; */
    return 5;
}