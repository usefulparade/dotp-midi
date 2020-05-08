var canvWidth, canvHeight;
var c, cParent;

var webMidiSupported, midiParent;
var midiScope, scopeLabel, scopeSelector;
var devices = [];
var deviceLabel, deviceSelector, outputDevice, midiParent;
var channelLabel, channelSelector, activeChannel;
var clockCheckbox;

var sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune;

var bpmSlider, transposeSlider;

var volume, volumeP, volumeSlider;

var mercuryBPM;

var planets = [];

var speed;

var dark;

var oscillators = [];

var envelopes = [];

var notes = []; 
var baseNotes = [];

var midiScale = [];
var dMajScale = [];
 
var intervalSelect, intervalVal;

WebMidi.enable(function(err) {
  if (err) {
    console.log("An error occurred", err);
    webMidiSupported = false;
  } else {
    webMidiSupported = true;
    console.log(WebMidi.inputs);
    console.log(WebMidi.outputs);
  }
});

function setup() {

  getAudioContext().suspend();

  if (windowWidth > windowHeight){
    canvWidth = windowHeight;
    canvHeight = windowHeight;
  } else {
    canvWidth = windowWidth;
    canvHeight = windowWidth;
  }

  c = createCanvas(canvWidth, canvHeight);
  cParent = document.getElementById('game');
  c.parent(cParent);

  

  dMajScale = [
    26, 28, 30, 31, 33, 35, 37
  ];

  for (i=7;i<42;i++){
    dMajScale[i] = dMajScale[i-7] + 12;
  }

  for (j=0;j<59;j++){
    midiScale[j] = dMajScale[j];
  }

  baseNotes = [
    new p5.Vector(90, 83), // mercury F#6 B5
    new p5.Vector(86, 79), // venus D6 G5
    new p5.Vector(81, 74), // earth A5 D5
    new p5.Vector(76, 69), // mars E5 A4
    new p5.Vector(71, 64), // jupiter B4 E4
    new p5.Vector(66, 59), // saturn F#4 B3
    new p5.Vector(64, 57), // uranus E4 A3
    new p5.Vector(57, 50), // neptune A3 D3
    new p5.Vector(57, 50), // sun 1
    new p5.Vector(45, 38), // sun 2
  ];

  for (i=0;i<baseNotes.length;i++){
    notes[i] = baseNotes[i];
  }

  // CREATE PLANETS

  sun = new Planet(0, 70, 0, "sun", 9);
  mercury = new Planet(50, 10, 1, "mercury", 0);
  venus = new Planet(75, 15, 0.7414966, "venus", 1);
  earth = new Planet(100, 20, 0.6292517, "earth", 2);
  mars = new Planet(125, 15, 0.51020408, "mars", 3);
  jupiter = new Planet(200, 50, 0.2755102, "jupiter", 4);
  saturn = new Planet(250, 40, 0.20408163, "saturn", 5);
  uranus = new Planet(300, 30, 0.14285714, "uranus", 6);
  neptune = new Planet(350, 20, 0.11564626, "neptune", 7);
  planets.push(mercury);
  planets.push(venus);
  planets.push(earth);
  planets.push(mars);
  planets.push(jupiter);
  planets.push(saturn);
  planets.push(uranus);
  planets.push(neptune);
  planets.push(sun);

  mercuryBPM = 2.94;

  // CREATE SYNTHS

  for (i=0;i<12;i++){
    
    envelopes[i] = new p5.Envelope();
    if (i < 8){
      envelopes[i].setADSR(0.1, 0.01, 0.2, 0.15 + i*0.1);
      envelopes[i].setRange(0.5, 0);
    } else {
      envelopes[i].setADSR(1, 1, 0.1, 1);
      envelopes[i].setRange(0.15, 0);
    }

    oscillators[i] = new p5.Oscillator('sine');
    oscillators[i].start();
    oscillators[i].amp(envelopes[i]);

    // planet starting pitches
    if (i < 8){
      oscillators[i].freq(midiToFreq(notes[i].x));
    }
  }

  // sun pitches
  oscillators[8].freq(midiToFreq(notes[8].x));
  oscillators[9].freq(midiToFreq(notes[8].y));
  oscillators[10].freq(midiToFreq(notes[9].x));
  oscillators[11].freq(midiToFreq(notes[9].y));

  speed = 0.01;

  dark = color(15, 15, 19);

  bpmSlider = document.getElementById('bpmSlider');
  transposeSlider = document.getElementById('transposeSlider');

  volume = 0.5;
  volumeP = document.getElementById("volumeP");
  volumeSlider = document.getElementById("volumeSlider");
  volumeSliderChange();

  intervalSelect = document.getElementById('intervalSelect');

  midiParent = document.getElementById('midiOptions');

  if (webMidiSupported){
    var divider = createP("~ ~ ~");
    divider.parent(midiParent);

    // SCOPE

    scopeLabel = createP("midi scope");
    scopeLabel.parent(midiParent);

    scopeSelector = createSelect();
    scopeSelector.parent(midiParent);
    scopeSelector.option("planets");

    for(i=0;i<planets.length;i++){
      scopeSelector.option("" + planets[i].name);
    }
    midiScope = 'planets';
    scopeSelector.changed(midiScopeChange);


    // OUTPUT

    deviceLabel = createP("midi output");
    deviceLabel.parent(midiParent);
    
    deviceSelector = createSelect();
    deviceSelector.parent(midiParent);

    deviceSelector.option('~ choose output ~');
    deviceSelector.disable('~ choose output ~');
    deviceSelector.changed(midiOutputChange);

    for (i=0;i<WebMidi.outputs.length;i++){
      var name = WebMidi.outputs[i]._midiOutput.name;
      devices[i] = "" + i + " " + name;
      deviceSelector.option(devices[i]);
    }
    outputDevice = 0;

    // CHANNEL

    channelLabel = createP("channel");
    channelLabel.parent(midiParent);

    channelSelector = createSelect();
    channelSelector.parent(midiParent);
    // channelSelector.addClass("select");
    
    for (j=0;j<8;j++){
      channelSelector.option(j+1);
    }
    channelSelector.changed(midiChannelChange);
    activeChannel = 1;

    clockCheckbox = createCheckbox(' send clock', false);
    clockCheckbox.parent(midiParent);
    clockCheckbox.class("checkbox");
  }

}

function draw() {

  background(dark);
  
  noFill();
  stroke(255);
  // ellipse(width/2, height/2, 100);

  push();
  translate(width/2, height/2);
  for (i=0;i<planets.length;i++){
    planets[i].show();
    planets[i].play();
  }
  pop();
}

var Planet = function(offset, diameter, ratio, name, index){
  this.delta = 0;
  this.index = index;
  this.trigger = false;
  this.offset = new p5.Vector(offset, 0);
  this.diameter = diameter;
  this.radius = this.diameter*0.5;
  if (this.diameter < 30){
    this.hitbox = this.diameter*0.8;
  } else {
    this.hitbox = this.diameter*0.5;
  }
  this.rotation = 0;
  this.ratio = ratio;
  this.name = name;
  this.pos = new p5.Vector(0, 0);
  this.mouseTrans = new p5.Vector(0,0);
  this.on = false;
  this.over = false;
  this.activeNote = 0;
  this.pan = 0;
  this.midiOutput = 0;
  this.midiChannel = 1;

  this.show = function(){

    if (this.on){
      this.rotation += (this.ratio*speed);
      // console.log(this.rotation);
      if (this.rotation%TWO_PI < PI){
        this.pan = map(this.rotation%TWO_PI, 0, PI, 1, -1);
      } else {
        this.pan = map(this.rotation%TWO_PI, PI, TWO_PI, -1, 1);
      }
      oscillators[this.index].pan(this.pan);
    }

    push();
      rotate(this.rotation);
      translate(this.offset);
      this.mouseTrans = new p5.Vector(mouseX-width/2, mouseY-height/2);
      this.mouseTrans.rotate(TWO_PI-this.rotation);
      this.mouseTrans.sub(this.offset);
      
      line(-this.rad, 0, this.rad, 0);
      if (this.mouseTrans.x > -this.hitbox && this.mouseTrans.x < this.hitbox && this.mouseTrans.y > -this.hitbox && this.mouseTrans.y < this.hitbox){
        this.over = true;
        push();
          fill(dark);
          stroke(255);
          ellipse(0, 0, this.diameter+20);
        pop();
      } else {
        this.over = false;
      }

      if (this.on){
        fill(255);
      } else {
        fill(dark);
      }
      stroke(255);
      ellipse(0, 0, this.diameter);
    pop();
  };

  this.play = function(){
    if (this.on && this.name != "sun"){
      this.delta = ((this.delta + (deltaTime/100)) % ((mercuryBPM)/this.ratio));
      // console.log(floor(this.delta));

      if (floor(this.delta) == 0 && this.trigger == false){

        triggerNote(this.index);
        this.trigger = true;
      }
  
      if (this.delta > 1 && this.trigger == true){
        this.trigger = false;
      }
    }

  };

  this.midiOutputChange = function(){
    var newDevice = this.deviceSelector.value().charAt(0);
    console.log("midi output device changed to: " + newDevice);
    this.midiOutput = newDevice;
  };

  this.midiChannelChange = function(){
    var newChannel = this.channelSelector.value().charAt(0);
    console.log("output channel changed to: " + this.channelSelector.value());
    this.midiChannel = newChannel;
  };

};

function radialStrings(){
  push();
    

  pop();
}

function mousePressed() {
  userStartAudio();
  getAudioContext().resume();

  for (i=0;i<planets.length;i++){
    if (planets[i].over){
      planets[i].on = !planets[i].on;
      planets[i].delta = 0;

      if (planets[i].name == "sun"){
        
        if (planets[i].on){
          for (i=8;i<12;i++){
            envelopes[i].triggerAttack();
          }
        } else {
          for (i=8;i<12;i++){
            envelopes[i].triggerRelease();
          }
        }
      }
    }
  }
}

function triggerNote(c){
  let note;
  if (planets[c].activeNote == 0){
    note = notes[c].x;
  } else {
    note = notes[c].y;
  }
  oscillators[c].freq(midiToFreq(note));

  envelopes[c].play();

  WebMidi.outputs[planets[c].midiOutput].playNote(note, planets[c].midiChannel, {duration: 10});

  planets[c].activeNote = (planets[c].activeNote + 1) % 2;
}


function bpmSliderChange(){
  // speed = floor(101-bpmSlider.value);
  mercuryBPM = (bpmSlider.max - (bpmSlider.value-bpmSlider.min)) * 0.01;
  // console.log(mercuryBPM);

}

function volumeSliderChange(){
  volume = map(volumeSlider.value, 0, 100, 0, 1);
  masterVolume(volume);
}

function filterSliderChange(){
  var frequency = map(filterSlider.value, 0, 100, 100, 1100);
  filter.freq(frequency);
}

function transposeSliderChange(){
  var transposeVector = new p5.Vector(transposeSlider.value-12, transposeSlider.value-12);

  for (i=0;i<notes.length;i++){
    var newX = midiScale.findIndex(n => n === notes[i].x);
    var newY = midiScale.findIndex(n => n === notes[i].y);
    notes[i] = new p5.Vector(dMajScale[newX]+transposeVector.x, dMajScale[newY] + transposeVector.y);
  }

  for (j=0;j<midiScale.length;j++){
    midiScale[j] = dMajScale[j] + transposeVector.x;
  }

  remapSunPitches();

}

function remapSunPitches(){
    // REMAP THE SUN
    oscillators[8].freq(midiToFreq(notes[8].x));
    oscillators[9].freq(midiToFreq(notes[8].y));
    oscillators[10].freq(midiToFreq(notes[9].x));
    oscillators[11].freq(midiToFreq(notes[9].y));
}

function windowResized(){
  if (windowWidth > windowHeight){
    resizeCanvas(windowHeight, windowHeight);
  } else {
    resizeCanvas(windowWidth, windowWidth);
  }
}

function touchStarted(){
  touchIsDown = true;
  userStartAudio();
  getAudioContext().resume();
}

function touchEnded(){
  touchIsDown = false;
}

function intervalSelector(){
  var intervalVal = intervalSelect.value;
  var base = notes[0];
  var newNotes = [];
  var ind = 0;

  if (intervalVal == 0){
    // FIFTHS
    console.log('new interval: fifths!');
    for (i=0;i<notes.length;i++){
      ind = midiScale.findIndex(n => n === notes[i].y);
      notes[i].x = midiScale[ind+4];
    }
  } else if (intervalVal == 1){
    // FOURTHS
    console.log('new interval: fourths!');
    for (i=0;i<notes.length;i++){
      ind = midiScale.findIndex(n => n === notes[i].y);
      notes[i].x = midiScale[ind+3];
    }

  } else if (intervalVal == 2){
    // THIRDS
    console.log('new interval: thirds!');
    for (i=0;i<notes.length;i++){
      ind = midiScale.findIndex(n => n === notes[i].y);
      notes[i].x = midiScale[ind+2];
    }
  } else if (intervalVal == 3){
    // SECONDS
    console.log('new interval: seconds!');
    for (i=0;i<notes.length;i++){
      ind = midiScale.findIndex(n => n === notes[i].y);
      notes[i].x = midiScale[ind+1];
    }
  }

  remapSunPitches();
}

function oscSelector(newOsc){
  var osc = newOsc.value;
  for (i=0;i<oscillators.length;i++){
    oscillators[i].setType(osc);
  }

}

function makeMicroNotes(){
  notes[0] = midiToFreq(60);
  microInterval = 1.0293;
  for (i=1;i<notes.length;i++){
    notes[i] = notes[i-1]*microInterval;
    console.log(notes[i]);
  }
}

function midiScopeChange(){
  midiScope = scopeSelector.value();
  for(i=0;i<planets.length;i++){
    if (planets[i].name == midiScope){
      console.log("midi scope changed to: " + midiScope);
      channelSelector.selected(planets[i].midiChannel);
      deviceSelector.selected(devices[planets[i].midiOutput]);
    }
  }
  
}

function midiOutputChange(){
  var newDevice = deviceSelector.value().charAt(0);
  for (i=0;i<planets.length;i++){
    if (midiScope == "planets"){
      if (i==0){
        console.log("midi output for all planets changed to: " + newDevice);
      }
      planets[i].midiOutput = newDevice;
    } else if (midiScope == "sun"){
      
      
    } else {
      if (midiScope == planets[i].name){
        console.log("midi output for " + midiScope + " changed to: " + newDevice);
        planets[i].midiOutput = newDevice;
      }
    }
  }
}

function midiChannelChange(){
  WebMidi.outputs[outputDevice].sendStop();
  var newChannel = channelSelector.value().charAt(0);
  for (i=0;i<planets.length;i++){
    if (midiScope == "planets"){
      if (i==0){
        console.log("channel for all planets changed to: " + channelSelector.value());
      }
      planets[i].midiChannel = newChannel;
      WebMidi.outputs[planets[i].midiOutput].sendStop();
    }  else if (midiScope == "sun"){
      
      
    } else {
      if (midiScope == planets[i].name){
        console.log("channel for " + midiScope + " changed to: " + channelSelector.value());
        planets[i].midiChannel = newChannel;
        WebMidi.outputs[planets[i].midiOutput].sendStop();
      }
    }
  }
}

function sendMidiClock(){
  // send midi clock
  if (webMidiSupported){
    if (clockCheckbox.checked()){
      if (speed >= 24){
        if (floor(clockCount%(speed/24)) == 0){
          if (!paused && webMidiSupported){
            WebMidi.outputs[outputDevice].sendClock();
          }
        }
      } else {
        if (floor(clockCount%(speed/(speed*0.5)) == 0)){
          if (!paused && webMidiSupported){
            WebMidi.outputs[outputDevice].sendClock();
          }
        }
      }
    }
  }
  clockCount++;

}
