const canvas = $('#penumbra')[0];
const ctx = canvas.getContext("2d");

let active = false;
let peek_energy;
let cursor_present = false;

let lower_edge = 0;
let upper_edge = 0;
let viewport_position = 1;
const move_value = 0.3;    // 1.0 - moving every trace off screen

const line_width = 5;
const max_lines_onscreen = Math.floor(800.0 / line_width);

let time_min, time_max;

const primary_font = "bold 16px TextBook";
const secondary_font = "12px Arial";

canvas.addEventListener('click', function(event) {
    if (!active || get_trace_at(peek_energy) != null) return;
    change_energy(peek_energy);
    draw_penumbra();
}, false);

canvas.addEventListener('mousemove', function(event) {
    if (!active) return;
    cursor_present = true;
    const mouse_pos = get_canvas_mouse_pos(canvas);
    peek_energy = x_to_energy(mouse_pos[0]);
    if (peek_energy < settings.lower || peek_energy > settings.upper) return;
    draw_penumbra();
}, false);

canvas.addEventListener('mouseout', function(event) {
    if (!active) return;
    cursor_present = false;
    draw_penumbra();
}, false);

window.addEventListener('keydown', function(event) {
    if (!active || document.activeElement != document.body) return;    // do not listen to arrow or AD keys when user is writing
    if (event.keyCode == 37) {   // left
        change_energy(float_to_step_precision(settings.energy-settings.step));
    } 
    else if (event.keyCode == 39) {   // right
        change_energy(float_to_step_precision(settings.energy+settings.step))
    }
}, false);

function set_penumbra_edges() {
    const arrow_left = document.getElementById("arrow_left");
    const arrow_right = document.getElementById("arrow_right");
    arrow_left.style.visibility = "visible";
    arrow_right.style.visibility = "visible";

    lower_edge = Math.round(max_lines_onscreen*(viewport_position-1));
    upper_edge = Math.round(max_lines_onscreen*viewport_position);

    if (lower_edge < 0) {
        //viewport_position += move_value;
        lower_edge = 0;
    }
    if (upper_edge > data.particles.length) {
        //viewport_position -= move_value;
        upper_edge = data.particles.length
    } 

    if (Math.ceil(viewport_position) == 1) {
        arrow_left.style.visibility = "hidden";
    }

    if (lower_edge >= data.particles.length - max_lines_onscreen) {
        arrow_right.style.visibility = "hidden";
    }
}

function penumbra_left () {
    viewport_position -= move_value;
    set_penumbra_edges()
    draw_penumbra();
}

function penumbra_right () {
    viewport_position += move_value;
    set_penumbra_edges()
    draw_penumbra();
}

// canvas x position to corresponding energy value
function x_to_energy (x) {
    if (x <= 1) return;
    return float_to_step_precision(Math.round(x-line_width/2.0)/line_width*settings.step + lower_edge*settings.step + settings.lower + settings.step);
}

// energy value to corresponding canvas x position
function energy_to_x (energy) {
    return Math.round(float_to_step_precision (energy-settings.lower) / settings.step + settings.step) * line_width - lower_edge * line_width - line_width;
}

function get_peek_particle () {
    return data.particles[Math.round(peek_energy / settings.step) - 1];
}

function init_penumbra () {
    active = true;
    viewport_position = 1;
    time_min = get_min_flight_time ();
    time_max = get_max_flight_time ();
    set_penumbra_edges();
    draw_penumbra();
}

function draw_penumbra () {
    if (!active) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    canvas.width = canvas.style.width = (upper_edge - lower_edge) * line_width;
    ctx.lineWidth = line_width;

    ctx.fillStyle = 'white';
    ctx.rect(0, 27, data.particles.length * ctx.lineWidth, 170);
    ctx.fill();

    ctx.font = primary_font;

    for (let i = 0; i < upper_edge - lower_edge; i++) {
        if (lower_edge + i >= data.particles.length) {
            break;
        }
        const particle = data.particles[lower_edge + i];
        let height = 30;
        if (particle[0] == peek_energy && cursor_present) height = 45;
        let color = particle[1] == 0 ? "gray" : "black";
        
        const drawn_trace = get_trace_at(particle[0]);
        if (drawn_trace != null) {
            height = 45;
            ctx.fillStyle = drawn_trace.color;
            ctx.font = primary_font;
            draw_energy_text (drawn_trace.settings.energy + "GV", energy_to_x(drawn_trace.settings.energy), 23);
            if (drawn_trace.color != "#ffffff") color = drawn_trace.color;
        }

        ctx.fillStyle = 'black';
        ctx.font = secondary_font;
        if (particle[0] == data.lower && data.lower != settings.lower) {
            height = 45;
            draw_energy_text ("R low", energy_to_x(particle[0]) - ctx.measureText("R low").width - 3, 72);
        }

        if (particle[0] == data.upper && data.upper != settings.upper) {
            height = 45;
            draw_energy_text ("R upp", energy_to_x(particle[0]) + 7, 72);
        }

        if (particle[0] == data.effective && data.effective != settings.lower && data.effective != settings.upper) {
            height = 45;
            draw_energy_text ("eff", energy_to_x(particle[0]) - ctx.measureText("eff").width / 2 + 3 , 84 + 3);
        }

        ctx.beginPath();
        ctx.moveTo(i * ctx.lineWidth+line_width/2.0, 30);
        ctx.lineTo(i * ctx.lineWidth+line_width/2.0, 30+height);
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    ctx.fillStyle = 'black';
    ctx.font = primary_font;
    if (cursor_present) {
        draw_peek_energy_text (peek_energy + "GV", energy_to_x(peek_energy) + 12 , 75)
    }

    draw_time();
}


function draw_time () {
    if (!active) return;

    ctx.lineWidth = 1;
    
    const max_height = 60;   // maximum time graph height, in pixels
    for (let i = 1; i < upper_edge - lower_edge; i++) {
        if (lower_edge + i >= data.particles.length) {
            break;
        }

        const height = time_normalize(data.particles[lower_edge + i][2]) * max_height; 
        const previous_height = time_normalize(data.particles[lower_edge + i-1][2]) * max_height;

        ctx.beginPath();
        ctx.moveTo(i* line_width + line_width/2.0, 155-height);
        ctx.lineTo((i-1) * line_width + line_width/2.0, 155-previous_height);
        ctx.strokeStyle = "black";
        ctx.stroke();
    }

    const peek_particle = get_peek_particle();
    if (peek_particle != undefined && cursor_present) {
        const height = time_normalize(peek_particle[2]) * max_height;
        draw_time_text(peek_particle[2] + "s", energy_to_x(peek_energy) + 10, 155-height + 5)
        ctx.fillRect(energy_to_x(peek_energy), 155-height - 2.5, 5, 5);   
    }

    ctx.fillStyle = 'white';
    ctx.font = secondary_font;
    draw_energy_text(float_to_step_precision((lower_edge + 1) * settings.step + settings.lower) + "GV", 8, 50);  
    draw_energy_text(float_to_step_precision(upper_edge * settings.step + settings.lower) + "GV", canvas.width - 8, 50);  
}

// confusion with settings flight time. change name?
function get_max_flight_time () {
    let max = 0.0;
    for (let i = 0; i < data.particles.length; i++) {
        if (data.particles[i][2] > max) max = data.particles[i][2];
    }
    return max;
}

function get_min_flight_time () {
    let min = Infinity;
    for (let i = 0; i < data.particles.length; i++) {
        if (data.particles[i][2] < min) min = data.particles[i][2];
    }
    return min;
}

function get_trace_at (energy) {
    for (let i = 0; i < traces.length; i++) {
        if (traces[i].settings.energy == energy) return traces[i];
    }
    return null;
}

// normalization of a time value to 0-1 range
function time_normalize (time) {
    return (time - time_min)/(time_max - time_min);
}

// draws any text in (x, y) and offsets x if it is outside canvas
function draw_energy_text (text, x, y) {
    const width = ctx.measureText(text).width;
    if (x > canvas.width - width) x -= width - 4;
    ctx.fillText(text, x, y);
}

function draw_peek_energy_text (text, x, y) {
    const width = ctx.measureText(text).width;
    if (x > canvas.width - width) x -= width + 20;
    ctx.fillStyle = "white";
    ctx.fillRect(x - 2, y - 15, width + 5, 22);
    ctx.fillStyle = "black";
    ctx.fillText(text, x, y);
    ctx.fillText(text, x, y);
}

function draw_time_text (text, x, y) {
    const width = ctx.measureText(text).width;
    if (x > canvas.width - width) x -= width + 18;
    ctx.fillStyle = "white";
    ctx.fillRect(x - 6, y - 15, width + 10, 22);
    ctx.fillStyle = "black";
    ctx.fillText(text, x, y);
}