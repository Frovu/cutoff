const canvas = $('#penumbra')[0];
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
    peek_energy = float_to_step_precision(peek_energy); // fixing floating number issues, check without parsefloat's later
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
    ctx.rect(0, 27, data.particles.length * ctx.lineWidth, 170);
    ctx.fill();
    // temporary lack of support of big data
    //energy_per_line = data.particles.length / canvas.width;
    
    ctx.font = "bold 16px Times New Roman";

    for (let i = 0; i < data.particles.length; i++) {
        const particle = data.particles[i];
        let height = 30;
        let color = data.particles[i][1] == 0 ? "gray" : "black"; 
        if (particle[0] == peek_energy && cursor_present) height = 30 + 15;
        const drawn_trace = get_trace_at(particle[0]);
        if (drawn_trace != null) {
            height = 30 + 15;
            ctx.fillStyle = drawn_trace.color;
            draw_text (drawn_trace.settings.energy + "GV", Math.ceil(float_to_step_precision (drawn_trace.settings.energy-settings.lower) / settings.step) * ctx.lineWidth, 23);
            color = drawn_trace.color == "#ffffff" ? "black" : drawn_trace.color;   // invert white color before drawing a stick
        }
        ctx.beginPath();
        ctx.moveTo(i * ctx.lineWidth+2.5, 30);
        ctx.lineTo(i * ctx.lineWidth+2.5, 30+height);
        ctx.strokeStyle = color;
        ctx.stroke();
    }


    ctx.fillStyle = 'gray';
    if (cursor_present && peek_energy != settings.energy) {
        draw_text (peek_energy + "GV", Math.round(float_to_step_precision (peek_energy-settings.lower) / settings.step) * ctx.lineWidth , 23)
    }

    ctx.fillStyle = 'black';

    draw_time();
}

function penumbra_left () {
    console.log("moving left");
    const diff = settings.upper - settings.lower;
    document.getElementById('lower').value = settings.lower - diff;
    document.getElementById('upper').value = settings.lower;
    submit();
}

function penumbra_right () {
    console.log("moving left");
    const diff = settings.upper - settings.lower;
    document.getElementById('lower').value = settings.upper;
    document.getElementById('upper').value = settings.upper + diff;
    submit();
}

function get_trace_at (energy) {
    for (let i = 0; i < traces.length; i++) {
        if (traces[i].settings.energy == energy) return traces[i];
    }
    return null;
}

function draw_time () {
    //const text = "Time of the proton motion in the magnetosphere, s";
    //draw_text (text, ctx.measureText(text).width / 2, 75);

    ctx.lineWidth = 1;
    const height_multiplier = 8.0; // 5 for now; change it dynamically later (rely on maximum flight time)
    for (let i = 1; i < data.particles.length; i++) {
        //const particle_id = Math.round(energy_per_line * i);
        const height = data.particles[i][2] * height_multiplier;
        const old_height = data.particles[i-1][2] * height_multiplier;
        ctx.beginPath();
        ctx.moveTo(i* 5 - 2.5, 155-height);
        ctx.lineTo((i-1) * 5 - 2.5, 155-old_height);
        ctx.strokeStyle = "black";
        ctx.stroke();
    }

    let peek_id = Math.round((peek_energy-settings.lower) / settings.step);
    
    draw_text_non_transparent(data.particles[peek_id][2] + "s", peek_id * ctx.lineWidth * 5 + 5, 155-data.particles[peek_id][2]*height_multiplier + 5)
    ctx.fillRect(peek_id * ctx.lineWidth * 5 - 2.5 - 2.5, 155-data.particles[peek_id][2]*height_multiplier - 2.5, 5, 5);


    // vertical labels
    /*
    ctx.beginPath();
    ctx.moveTo(10, 90);
    ctx.lineTo(10, 140);
    ctx.strokeStyle = "black";
    ctx.stroke();

    // horizontal labels
    ctx.beginPath();
    ctx.moveTo(10, 140);
    ctx.lineTo(canvas.width - 10, 140);
    ctx.strokeStyle = "black";
    ctx.stroke();*/
}

// draws any text in (x, y) and offsets x if it is outside canvas
function draw_text (text, x, y) {
    const width = ctx.measureText(text).width;
    if (x > canvas.width - width) x -= width + 16;
    ctx.fillText(text, x, y);
}

function draw_text_non_transparent (text, x, y) {
    const width = ctx.measureText(text).width;
    if (x > canvas.width - width) x -= width + 16;
    ctx.fillStyle = "white";
    ctx.fillRect(x - 6, y - 15, width + 10, 22);
    ctx.fillStyle = "black";
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