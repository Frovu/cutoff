const time_canvas = document.getElementById("time_graph");
const time_ctx = time_canvas.getContext("2d");

const primary_font = "bold 16px TextBook";
const secondary_font = "12px Arial";

let peek_energy;
let penumbras = [];

const move_value = 0.3;    // 1.0 - moving every trace off screen

const line_width = 5;
const max_penumbra_width = 600.0;
const max_len = Math.floor(max_penumbra_width / line_width);

// position and other parameters of penumbras viewport(s)
let pos = {
    e: 0,      // current energy at the left edge
    e_min: 0,  // min energy of all penumbras
    e_max: 0,  // max energy of all penumbras
    time_min: 0, // time graph scale
    time_max: 0,
    step: 0.1,   // de facto max step
    move_val: 2, // move val in energy
    step_changed: false,
    len: 0 // number of particles on the screen
}

// x in range of 0 - max_penumbra_width
function x_to_energy(x) {
    const n = pos.e + Math.floor(x / line_width) * pos.step;
    return Math.round(n*10000)/10000;
}
function energy_to_x(energy) {
    return Math.round((energy - pos.e) / pos.step * line_width);
}

let Penumbra = function(instance, canvas) {
    this.id = instance.id;
    this.data = instance.data;
    this.settings = instance.settings;
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.cursor_present = false;
    this.traces = [];

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
};

function add_penumbra(instance) {
    const row = document.createElement("div");
    row.classList = "row align-items-center";
    const text_col = document.createElement("div");
    text_col.style = "pointer-events: none; position: relative; top: 14px;";
    text_col.classList = "col-sm pr-0";
    row.appendChild(text_col);

    const text = document.createElement("p");
    text.classList = "text-white text-right noselect h6 mb-0";
    text.innerHTML = `<b>${instance.name || (isStation(instance.settings.lat, instance.settings.lon) ||
`( ${instance.settings.lat.toFixed(2)}°, ${instance.settings.lon.toFixed(2)}° )`)}</b>. ${instance.settings.vertical}°/${instance.settings.azimutal}°, ${get_model_by_id(instance.settings.model).name}<br>lower: ${instance.data.lower} GV<br>upper: ${instance.data.upper} GV<br>effective: <b>${instance.data.effective} GV</b>`;
    text_col.appendChild(text);

    const canvas_col = document.createElement("div");
    canvas_col.classList = "col-sm";
    row.appendChild(canvas_col);

    const canvas = document.createElement("canvas");
    canvas.classList = "center penumbra";
    canvas_col.appendChild(canvas);

    const stuff_col = document.createElement("div");
    stuff_col.classList = "col-sm";
    row.appendChild(stuff_col);

    const parent = document.getElementById("penumbras-container");
    //parent.prepend(canvas);
    parent.appendChild(row);
    let penumbra = new Penumbra(instance, canvas);

    add_event_listeners(penumbra);
    penumbras.push(penumbra);

    init_penumbras();

    return penumbra;
}

function init_penumbras() {
    if(!penumbras.length) return; // TODO ?

    const p0 = penumbras[0];
    pos.step = p0.settings.step;
    pos.step_changed = false;
    pos.len = 0;
    pos.e_min = p0.data.particles[0][0];
    pos.e_max = p0.data.particles[p0.data.particles.length-1][0];

    // find the max step
    for(const p of penumbras) {
        if(p.settings.step > pos.step) {
            pos.step = p.settings.step;
            pos.step_changed = true;
        }
    }
    // adjust len and min/max energy
    for(const p of penumbras) {
        if(pos.len < max_len) {
            let l = p.data.particles.length;
            l /= pos.step / p.settings.step;
            if(l > pos.len) pos.len = l > max_len ? max_len : l;
        }
        let em = p.data.particles[0][0];
        if(em < pos.e_min) pos.e_min = em;
        em = p.data.particles[p.data.particles.length-1][0];
        if(em > pos.e_max) pos.e_max = em;
    }
    // move the frame so the R eff of the first penumbra will be in the middle
    // do this only if the effective is truly determined
    if(p0.data.lower > pos.e_min)
        pos.e = Math.round((p0.data.effective - (pos.step * max_len/2))*10000)/10000;
    if(pos.e < pos.e_min)
        pos.e = pos.e_min;
    // round up to step
    pos.e = pos.step * Math.ceil(pos.e/pos.step);

    pos.move_val = pos.step * Math.ceil(max_len * move_value);
    move_penumbras();
}

function move_penumbras() {
    // hide arroews if needed
    const arrow_left = document.getElementById("arrow_left");
    const arrow_right = document.getElementById("arrow_right");
    arrow_left.style.visibility = pos.e > pos.e_min ? "visible" : "hidden";
    arrow_right.style.visibility = pos.e + pos.step*pos.len < pos.e_max ? "visible" : "hidden";
    pos.time_min = 9999; pos.time_max = 0; // readjust time graph scale
    for(const p of penumbras) {
        // initialize data so it will draw fast cause only needed particles left
        p.particles = [];
        for(let e = pos.e; e < pos.e + pos.step * pos.len; e+=pos.step) {
            e = Math.round(e*10000)/10000;
            const particle = p.data.particles.find(p => p[0] === e);
            p.particles.push(particle || null);
            if(particle && particle[2] > pos.time_max) pos.time_max = particle[2];
            if(particle && particle[2] < pos.time_min) pos.time_min = particle[2];
        }
    }
    for(const p of penumbras)
        draw_penumbra(p);
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
       peek_energy = x_to_energy(mouse_pos[0]);
      if (peek_energy < penumbra.settings.lower || peek_energy > penumbra.settings.upper) return;
      draw_penumbra(penumbra);
    }, false);

    penumbra.canvas.addEventListener('mouseout', function(event) {
       penumbra.cursor_present = false;
       draw_penumbra(penumbra);
    }, false);
}

function hide_penumbra(id) {
    const penumbra = penumbras.find(p => p.id === id);
    penumbra.canvas.parentElement.parentElement.remove();   // just works
    for (const trace of penumbra.traces)
        delete_trace(traces.indexOf(trace));
    penumbras.splice(penumbras.indexOf(penumbra), 1);

    if (penumbras.length == 0)
        time_ctx.clearRect(0, 0, time_canvas.width, time_canvas.height);
        
    init_penumbras(); // reinit penumbras (in case if max step changed or smh)
}

function move_penumbra_left () {
    pos.e -= pos.move_val;
    move_penumbras();
}

function move_penumbra_right () {
    pos.e += pos.move_val;
    move_penumbras();
}

function draw_penumbra(penumbra) {
    const ctx = penumbra.ctx;
    const canvas = penumbra.canvas;
    const data = penumbra.data;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    canvas.width = canvas.style.width = pos.len * line_width;
    canvas.height = canvas.style.height = 76;
    ctx.lineWidth = line_width;

    ctx.fillStyle = 'white';
    ctx.rect(0, 28, data.particles.length * ctx.lineWidth, 76);
    ctx.fill();

    ctx.font = primary_font;

    for(let i = 0; i < penumbra.particles.length; ++i) {
        const particle = penumbra.particles[i];
        if(!particle) continue;

        let height = 30;
        if (particle[0] == peek_energy && penumbra.cursor_present) height = 45;
        let color = particle[1] == 0 ? "gray" : "black";

        const drawn_trace = get_trace_at(penumbra, particle[0]);
        if (drawn_trace != null) {
            height = 45;
            ctx.fillStyle = drawn_trace.color;
            ctx.font = primary_font;
            penumbra.draw_energy_text (drawn_trace.energy + "GV", energy_to_x(drawn_trace.energy), 23);
            if (drawn_trace.color != "#ffffff") color = drawn_trace.color;
        }

        ctx.fillStyle = 'black';
        ctx.font = secondary_font;

        if (particle[0] == data.lower && data.lower != penumbra.settings.lower) {
            height = 45;
            penumbra.draw_energy_text ("R low", energy_to_x(particle[0]) - ctx.measureText("R low").width - 3, 72);
        }
        if (particle[0] == data.upper && data.upper != penumbra.settings.upper) {
            height = 45;
            penumbra.draw_energy_text ("R upp", energy_to_x(particle[0]) + 7, 72);
        }
        /*if (particle[0] == data.effective && data.effective != penumbra.settings.lower && data.effective != penumbra.settings.upper) {
            height = 45;
            penumbra.draw_energy_text ("eff", energy_to_x(particle[0]) - ctx.measureText("eff").width / 2 + 3 , 72);
        }*/

        ctx.beginPath();
        ctx.moveTo(i * ctx.lineWidth+line_width/2.0, 30);
        ctx.lineTo(i * ctx.lineWidth+line_width/2.0, 30+height);
        ctx.strokeStyle = color;
        ctx.stroke();
    }

    ctx.fillStyle = 'black';
    ctx.font = primary_font;
    if (penumbra.cursor_present)
        penumbra.draw_peek_energy_text(peek_energy + "GV", energy_to_x(peek_energy) + 12 , 75)

    ctx.fillStyle = 'white';
    ctx.font = secondary_font;
    penumbra.draw_energy_text(pos.e + "GV", 8, 50);
    penumbra.draw_energy_text(penumbra.particles[penumbra.particles.length-1][0] + "GV", penumbra.canvas.width - 8, 50);
    draw_time();
}


function draw_time() {
    time_canvas.height = time_canvas.style.height = 76;
    time_canvas.width = time_canvas.style.width = pos.len * line_width;

    time_ctx.fillStyle = 'white';
    time_ctx.rect(0, 0, time_canvas.width, time_canvas.height);
    time_ctx.fill();

    time_ctx.fillStyle = 'black';
    time_ctx.font = primary_font;
    time_ctx.lineWidth = 1;

    const max_height = 50;   // maximum time graph height, in pixels
    for (const p of penumbras) {
        for (let i = 1; i < pos.len; i++) {
            if(!p.particles[i]) continue;
            const height = normalize(p.particles[i][2], pos.time_min, pos.time_max) * max_height;
            const previous_height = normalize(p.particles[i-1][2], pos.time_min, pos.time_max) * max_height;
            time_ctx.beginPath();
            time_ctx.moveTo(i    * line_width + line_width/2.0, 60-height);
            time_ctx.lineTo((i-1)* line_width + line_width/2.0, 60-previous_height);
            time_ctx.strokeStyle = p.cursor_present ? "black" : "gray";
            time_ctx.stroke();
        }
        if(p.cursor_present) {
            const peek_particle = p.particles.find(e => e && e[0] === peek_energy);
            //console.log(peek_energy, peek_particle)
            if(!peek_particle) continue;
            const height = normalize(peek_particle[2], pos.time_min, pos.time_max) * max_height;
            let x = energy_to_x(peek_energy) + 10;
            const y = 60 - height + 5;
            const text = peek_particle[2] + "s";
            time_ctx.fillStyle = "white";
            time_ctx.fillRect(x - 6, y - 15, time_ctx.measureText(text).width + 10, 22);
            time_ctx.fillStyle = "black";
            time_ctx.fillText(text, x, y);

            time_ctx.fillRect(energy_to_x(peek_energy), 60 - height - 2.5, 5, 5);
        }
    }
}

// strange
function get_trace_at (penumbra, energy) {
    for (let i = 0; i < traces.length; i++) {
        if (traces[i].energy == energy && traces[i].penumbra == penumbra) return traces[i];
    }
    return null;
}
