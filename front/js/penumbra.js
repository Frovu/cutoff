const time_canvas = document.getElementById("time_graph");
const time_ctx = time_canvas.getContext("2d");

const primary_font = "bold 16px TextBook";
const secondary_font = "12px Arial";

let peek_energy;
let penumbras = [];
let step = 0.1;

let viewport_position = 1;
const move_value = 0.3;    // 1.0 - moving every trace off screen

const line_width = 5;
const max_lines_onscreen = Math.floor(800.0 / line_width);

let time_min = 1000;
let time_max = 0;


let Penumbra = (function(instance, canvas) {
    // prob better to have single "instance" variable (or not)
    this.id = instance.id;
    this.data = instance.data,
    this.settings = instance.settings,
    this.canvas = canvas,
    this.ctx = canvas.getContext("2d"),
    this.cursor_present = false,
    this.lower_edge = 0,
    this.upper_edge = 0,
    this.traces = [];


    this.set_edges = function () {
        const arrow_left = document.getElementById("arrow_left");
        const arrow_right = document.getElementById("arrow_right");
        arrow_left.style.visibility = "visible";
        arrow_right.style.visibility = "visible";

        this.lower_edge = Math.round(max_lines_onscreen*(viewport_position-1));
        this.upper_edge = Math.round(max_lines_onscreen*viewport_position);

        // TODO add penumbra sizes(step) conflict fix

        if (this.lower_edge < 0) this.lower_edge = 0;
        if (this.upper_edge > this.data.particles.length) this.upper_edge = this.data.particles.length
        if (Math.ceil(viewport_position) == 1) arrow_left.style.visibility = "hidden";
        if (this.lower_edge >= this.data.particles.length - max_lines_onscreen) arrow_right.style.visibility = "hidden";
    }

    // draws any text in (x, y) and offsets x if it is outside canvas
    this.draw_energy_text = function (text, x, y) {
        const width = this.ctx.measureText(text).width;
        if (x > canvas.width - width) x -= width - 4;
        this.ctx.fillText(text, x, y);
    }

    this.draw_peek_energy_text = function (text, x, y) {
        const width = this.ctx.measureText(text).width;
        if (x > canvas.width - width) x -= width + 20;
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(x - 2, y - 15, width + 5, 22);
        this.ctx.fillStyle = "black";
        this.ctx.fillText(text, x, y);
        this.ctx.fillText(text, x, y);
    }

    this.x_to_energy = function (x) {
        if (x <= 1) return;
        this.settings.lower = parseFloat(this.settings.lower);
        this.settings.upper = parseFloat(this.settings.upper);
        this.settings.step = parseFloat(this.settings.step);
        return float_to_step_precision(Math.round(x-line_width/2.0)/line_width*this.settings.step + this.lower_edge*this.settings.step + this.settings.lower + this.settings.step, this.settings.step);
    }

    this.energy_to_x = function (energy) {
        this.settings.lower = parseFloat(this.settings.lower);
        this.settings.upper = parseFloat(this.settings.upper);
        this.settings.step = parseFloat(this.settings.step);
        return Math.round(float_to_step_precision (energy-this.settings.lower, this.settings.step) / this.settings.step + this.settings.step) * line_width - this.lower_edge * line_width - line_width;
    }
});


// INIT PART START
function add_penumbra (instance) {
    const canvas = document.createElement("canvas");
    canvas.classList = "center penumbra";
    const parent = document.getElementById("penumbras-container");
    //parent.prepend(canvas);
    parent.appendChild(canvas);
    let penumbra = new Penumbra(instance, canvas);

    
    const temp_time_min = get_min_flight_time (penumbra);
    const temp_time_max = get_max_flight_time (penumbra);
    if (temp_time_min < time_min) time_min = temp_time_min;
    if (temp_time_max > time_max) time_max = temp_time_max;

    add_event_listeners(penumbra);
    penumbra.set_edges();
    penumbras.push(penumbra);

    draw_penumbra(penumbra);

    return penumbra;
}

function add_event_listeners (penumbra) {
    penumbra.canvas.addEventListener('click', function(event) {
        //if (get_trace_at(peek_energy) != null) return;
        fetch_trace(penumbra, peek_energy);
        draw_penumbra(penumbra);
    }, false);

    penumbra.canvas.addEventListener('mousemove', function(event) {
       penumbra.cursor_present = true;
       const mouse_pos = get_canvas_mouse_pos(penumbra.canvas);
       peek_energy = penumbra.x_to_energy(mouse_pos[0]);
      if (peek_energy < penumbra.settings.lower || peek_energy > penumbra.settings.upper) return;
      draw_penumbra(penumbra);
    }, false);

    penumbra.canvas.addEventListener('mouseout', function(event) {
       penumbra.cursor_present = false;
       draw_penumbra(penumbra);
    }, false);
}


// confusion with settings flight time. change name?
function get_max_flight_time (penumbra) {
    let max = 0.0;
    for (let i = 0; i < penumbra.data.particles.length; i++) {
        if (penumbra.data.particles[i][2] > max) max = penumbra.data.particles[i][2];
    }
    return max;
}

function get_min_flight_time (penumbra) {
    let min = Infinity;
    for (let i = 0; i < penumbra.data.particles.length; i++) {
        if (penumbra.data.particles[i][2] < min) min = penumbra.data.particles[i][2];
    }
    return min;
}

// INIT PART END


function hide_penumbra (penumbra) {
    penumbra.canvas.remove();
    for (const trace of penumbra.traces) {
        delete_trace(traces.indexOf(trace));
    }

    delete instancePenumbras[penumbra.id];  // TODO remove remove remove remove
    //penumbras.splice(penumbras.indexOf(penumbra.id), 1);
    penumbras.splice(penumbras.indexOf(penumbra), 1);

    if (penumbras.length == 0) {
        time_ctx.clearRect(0, 0, time_canvas.width, time_canvas.height);
        return;
    }
}

function move_penumbra_left () {
    viewport_position -= move_value;

    penumbras.forEach((penumbra) => {
        penumbra.set_edges();
        draw_penumbra(penumbra);
    });
}

function move_penumbra_right () {
    viewport_position += move_value;

    penumbras.forEach((penumbra) => {
        penumbra.set_edges();
        draw_penumbra(penumbra);
    });
}

function draw_penumbra (penumbra) {
    const ctx = penumbra.ctx;
    const canvas = penumbra.canvas;
    const data = penumbra.data;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    canvas.width = canvas.style.width = (penumbra.upper_edge - penumbra.lower_edge) * line_width;
    canvas.height = canvas.style.height = 76;
    ctx.lineWidth = line_width;

    ctx.fillStyle = 'white';
    ctx.rect(0, 27, data.particles.length * ctx.lineWidth, 60);
    ctx.fill();

    ctx.font = primary_font;

    for (let i = 0; i < penumbra.upper_edge - penumbra.lower_edge; i++) {
        if (penumbra.lower_edge + i >= data.particles.length) {
            break;
        }
        const particle = data.particles[penumbra.lower_edge + i];
        let height = 30;
        if (particle[0] == peek_energy && penumbra.cursor_present) height = 45;
        let color = particle[1] == 0 ? "gray" : "black";
        
        const drawn_trace = get_trace_at(penumbra, particle[0]);
        if (drawn_trace != null) {
            height = 45;
            ctx.fillStyle = drawn_trace.color;
            ctx.font = primary_font;
            penumbra.draw_energy_text (drawn_trace.energy + "GV", penumbra.energy_to_x(drawn_trace.energy), 23);
            if (drawn_trace.color != "#ffffff") color = drawn_trace.color;
        }

        /*
        ctx.fillStyle = 'black';
        ctx.font = secondary_font;

        if (particle[0] == data.lower && data.lower != penumbra.settings.lower) {
            height = 45;
            penumbra.draw_energy_text ("R low", penumbra.energy_to_x(particle[0]) - ctx.measureText("R low").width - 3, 72);
        }

        if (particle[0] == data.upper && data.upper != penumbra.settings.upper) {
            height = 45;
            penumbra.draw_energy_text ("R upp", penumbra.energy_to_x(particle[0]) + 7, 72);
        }

        if (particle[0] == data.effective && data.effective != penumbra.settings.lower && data.effective != penumbra.settings.upper) {
            height = 45;
            penumbra.draw_energy_text ("eff", penumbra.energy_to_x(particle[0]) - ctx.measureText("eff").width / 2 + 3 , 84 + 3);
        }*/

        ctx.beginPath();
        ctx.moveTo(i * ctx.lineWidth+line_width/2.0, 30);
        ctx.lineTo(i * ctx.lineWidth+line_width/2.0, 30+height);
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    ctx.fillStyle = 'black';
    ctx.font = primary_font;
    if (penumbra.cursor_present) {
        penumbra.draw_peek_energy_text (peek_energy + "GV", penumbra.energy_to_x(peek_energy) + 12 , 75)
    }

    ctx.fillStyle = 'white';
    ctx.font = secondary_font;

    //shit
    penumbra.settings.lower = parseFloat(penumbra.settings.lower);
    penumbra.settings.upper = parseFloat(penumbra.settings.upper);
    penumbra.settings.step = parseFloat(penumbra.settings.step);

    penumbra.draw_energy_text(float_to_step_precision((penumbra.lower_edge + 1) * penumbra.settings.step + penumbra.settings.lower, penumbra.settings.step) + "GV", 8, 50);  
    penumbra.draw_energy_text(float_to_step_precision(penumbra.upper_edge * penumbra.settings.step + penumbra.settings.lower, penumbra.settings.step) + "GV", penumbra.canvas.width - 8, 50);  

    draw_time(penumbra);
}


function draw_time (penumbra) {
    time_canvas.height = time_canvas.style.height = 76;
    time_canvas.width = time_canvas.style.width = (penumbra.upper_edge - penumbra.lower_edge) * line_width;

    time_ctx.fillStyle = 'white';
    time_ctx.rect(0, 0, time_canvas.width, time_canvas.height);
    time_ctx.fill();

    if (!penumbra.cursor_present) return;

    //penumbra.canvas.after(time_canvas); // experimental

    time_ctx.fillStyle = 'black';
    time_ctx.font = primary_font;
    time_ctx.lineWidth = 1;

    const max_height = 50;   // maximum time graph height, in pixels
    for (let i = 1; i < penumbra.upper_edge - penumbra.lower_edge; i++) {
        if (penumbra.lower_edge + i >= penumbra.data.particles.length) {
            break;
        }

        const height = normalize(penumbra.data.particles[penumbra.lower_edge + i][2], time_min, time_max) * max_height; 
        const previous_height = normalize(penumbra.data.particles[penumbra.lower_edge + i-1][2], time_min, time_max) * max_height;
        //console.log(normalize(penumbra.data.particles[penumbra.lower_edge + i][2], time_min, time_max));

        time_ctx.beginPath();
        time_ctx.moveTo(i* line_width + line_width/2.0, 60-height);
        time_ctx.lineTo((i-1) * line_width + line_width/2.0, 60-previous_height);
        time_ctx.strokeStyle = "black";
        time_ctx.stroke();
    }


    const peek_particle = get_peek_particle(penumbra);
    if (peek_particle != undefined && penumbra.cursor_present) {
        const height = normalize(peek_particle[2], time_min, time_max) * max_height;
        draw_time_text(peek_particle[2] + "s", penumbra.energy_to_x(peek_energy) + 10, 60-height + 5)
        time_ctx.fillRect(penumbra.energy_to_x(peek_energy), 60-height - 2.5, 5, 5);   
    }
}


function draw_time_text(text, x, y) {
    const width = time_ctx.measureText(text).width;
    if (x > time_canvas.width - width) x -= width + 18;
    time_ctx.fillStyle = "white";
    time_ctx.fillRect(x - 6, y - 15, width + 10, 22);
    time_ctx.fillStyle = "black";
    time_ctx.fillText(text, x, y);
}

// strange 
function get_trace_at (penumbra, energy) {
    for (let i = 0; i < traces.length; i++) {
        if (traces[i].energy == energy && traces[i].penumbra == penumbra) return traces[i];
    }
    return null;
}

function get_peek_particle (penumbra) {
    return penumbra.data.particles[Math.round(peek_energy / penumbra.settings.step) - 1];
}