const canvas = $('#penumbra')[0];
const ctx = canvas.getContext("2d");

let active = false;
let peek_energy;
let cursor_present = false;

let lower_edge = 0;
let upper_edge = 0;
let viewport_position = 1;

const line_width = 5;
const max_lines_onscreen = Math.floor(800.0 / line_width);


canvas.addEventListener('click', function(event) {
    if (!active) return;
    change_energy(peek_energy);
    draw_penumbra();
}, false);

canvas.addEventListener('mousemove', function(event) {
    if (!active) return;
    cursor_present = true;
    const mouse_pos = get_canvas_mouse_pos(canvas);
    peek_energy = Math.floor(mouse_pos[0]-line_width/2.0)/line_width*settings.step + parseFloat(float_to_step_precision(lower_edge*settings.step));
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

function set_penumbra_edges() {
    // max_lines_onscreen*multiplier
    //if (max_lines_onscreen*multiplier) 
    console.log("setting edges");
    lower_edge = Math.floor(max_lines_onscreen*(viewport_position-1));
    upper_edge = Math.floor(max_lines_onscreen*viewport_position);
    console.log("upper_edge = " + upper_edge);
    console.log("lower_edge = " + lower_edge);
}

function penumbra_left () {
    //const diff = settings.upper - settings.lower / 3.0;
    viewport_position -= 0.33; // change to .33
    set_penumbra_edges()
    draw_penumbra();
}

function penumbra_right () {
    //const diff = settings.upper - settings.lower / 3.0;
    viewport_position += 0.33; // change to .33
    set_penumbra_edges()
    draw_penumbra();
}

function energy_to_x (energy) {
    return Math.round(float_to_step_precision (parseFloat(energy)) / settings.step) * line_width - lower_edge * line_width;
}

function draw_penumbra () {
    if (!active) active = true; // maybe you can use first_start_occured instead? btw rename this variable
    if (lower_edge == 0) {
        //set_penumbra_edges()
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //canvas.width = canvas.style.width = data.particles.length * line_width > 850 ? 850 : data.particles.length * line_width;
    ctx.lineWidth = line_width;

    ctx.fillStyle = 'white';
    ctx.rect(0, 27, data.particles.length * ctx.lineWidth, 170);
    ctx.fill();
    // temporary lack of support of big data
    //energy_per_line = data.particles.length / canvas.width;

    ctx.font = "bold 16px Times New Roman";

    for (let i = 0; i < upper_edge - lower_edge; i++) {
        if (lower_edge + i >= data.particles.length) {
            break;
        }
        const particle = data.particles[lower_edge + i];
        let height = 30;
        if (particle[0] == peek_energy && cursor_present) height = 30 + 15;
        let color = particle[1] == 0 ? "gray" : "black";
        
        const drawn_trace = get_trace_at(particle[0]);
        if (drawn_trace != null) {
            height = 30 + 15;
            ctx.fillStyle = drawn_trace.color;
            draw_energy_text (drawn_trace.settings.energy + "GV", energy_to_x(drawn_trace.settings.energy), 23);
            if (drawn_trace.color != "#ffffff") color = drawn_trace.color;
        }
        ctx.beginPath();
        ctx.moveTo(i * ctx.lineWidth+line_width/2.0, 30);
        ctx.lineTo(i * ctx.lineWidth+line_width/2.0, 30+height);
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    ctx.fillStyle = 'black';

    if (cursor_present) {
        draw_peek_energy_text (peek_energy + "GV", energy_to_x(peek_energy) + 10 , 75)
    }

    

    draw_time();
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
    for (let i = 1; i < upper_edge - lower_edge; i++) {
        if (lower_edge + i >= data.particles.length) {
            break;
        }
        //const particle_id = Math.round(energy_per_line * i);
        const height = data.particles[lower_edge + i][2] * height_multiplier;
        const old_height = data.particles[lower_edge + i-1][2] * height_multiplier;
        ctx.beginPath();
        ctx.moveTo(i* line_width + line_width/2.0, 155-height);
        ctx.lineTo((i-1) * line_width + line_width/2.0, 155-old_height);
        ctx.strokeStyle = "black";
        ctx.stroke();
    }

    let peek_id = Math.round(peek_energy / settings.step) - lower_edge;
    if (!isNaN(peek_id) && cursor_present && lower_edge + peek_id < data.particles.length) {
        draw_time_text(data.particles[lower_edge + peek_id][2] + "s", energy_to_x(peek_energy) + 10, 155-data.particles[lower_edge + peek_id][2]*height_multiplier + 5)
        ctx.fillRect(peek_id * line_width, 155-data.particles[lower_edge + peek_id][2]*height_multiplier - 2.5, 5, 5);   
    }



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
function draw_energy_text (text, x, y) {
    const width = ctx.measureText(text).width;
    if (x > canvas.width - width) x -= width - 4;
    ctx.fillText(text, x, y);
}

function draw_peek_energy_text (text, x, y) {
    const width = ctx.measureText(text).width;
    if (x > canvas.width - width) x -= width + 16;
    ctx.fillText(text, x, y);
}

function draw_time_text (text, x, y) {
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
