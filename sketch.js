var canvWidth, canvHeight;
var c, cParent;
var orientationRotation;

var webMidiSupported, webMidiMade, midiParent;
var webMidiCheckDone = false;
var midiScope, scopeLabel, scopeSelector;
var devices = [];
var deviceLabel, deviceSelector, outputDevice, midiParent;
var channelLabel, channelSelector, activeChannel;
var inputDevices = [];
var inputDeviceLabel, inputDeviceSelector, inputDevice;
var inputChannelLabel, inputChannelSelector, inputActiveChannel;
var inputCCLabel, inputCCSelect, inputCCVal;
var inputCCFunctionLabel, inputCCFunctionSelect, inputCCFunction, inputCCListening;
var inputCCFunctionMap = [];
var keyboardMapSelector, currentKeyboardMap;
var midiOutLabel, midiInLabel, outputDiv, inputDiv, listeningP;
var filter, filterFreq, filterRes, filterSlider, resSlider;

var dly, dlyTime, dlyFeedback, dlySlider, feedbackSlider, delaySliderChange;


var sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune;

var bpmSlider, transposeSlider, transposeP;

var volume, volumeP, volumeSlider;

var attack, decay, sustain, release, attackSlider, releaseSlider;

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

var transposeKeys = [];

var touchIsDown;

WebMidi.enable(function(err) {
  if (err) {
    console.log("An error occurred", err);
    webMidiSupported = false;
  } else {
    webMidiSupported = true;
    console.log(WebMidi.inputs);
    console.log(WebMidi.outputs);
  }
  webMidiCheckDone = true;
  // makeMidiOptions();
});

function setup() {

  getAudioContext().suspend();

  touchIsDown = false;

  if (windowWidth > windowHeight){
    canvWidth = 750;
    canvHeight = windowHeight;
    orientationRotation = 0;
  } else {
    canvWidth = windowWidth;
    canvHeight = 750;
    orientationRotation = HALF_PI;
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
  
  attack = 0.006;
  decay = 0.01;
  sustain = 0.2;
  release = 0.15;

  // CREATE SYNTHS
  
  filter = new p5.LowPass();
  filterFreq = 2200;
  filterRes = 10;
  filter.set(filterFreq, filterRes);

  for (i=0;i<12;i++){
    
    envelopes[i] = new p5.Envelope();
    if (i < 8){
      envelopes[i].setRange(0.5, 0);
      envelopes[i].setADSR(attack, decay, sustain, release + i*0.1);
    } else {
      envelopes[i].setRange(0.15, 0);
      envelopes[i].setADSR(1, 1, 0.5, 1);
    }

    oscillators[i] = new p5.Oscillator('sine');
    oscillators[i].disconnect();
    oscillators[i].connect(filter);
    oscillators[i].start();
    oscillators[i].amp(envelopes[i]);
    if (i > 0 && i < 12){
      // oscillators[i].amp(oscillators[i-1]);
      // oscillators[i].amp(envelopes[i]);
      // oscillators[i].disconnect(oscillators[i-1]);
    }

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
  
  transposeKeys = ['D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#'];

  bpmSlider = document.getElementById('bpmSlider');
  transposeSlider = document.getElementById('transposeSlider');
  transposeP = document.getElementById('transposeP');
  attackSlider = document.getElementById('attackSlider');
  releaseSlider = document.getElementById('releaseSlider');
  filterSlider = document.getElementById('filterSlider');
  resSlider = document.getElementById('resSlider');

  volume = 0.5;
  volumeP = document.getElementById("volumeP");
  volumeSlider = document.getElementById("volumeSlider");
  volumeSliderChange();

  intervalSelect = document.getElementById('intervalSelect');


  midiParent = document.getElementById('midiOptions');

  webMidiMade = false;
  

}

function draw() {

  background(dark);
  
  noFill();
  stroke(255);

  push();
  translate(width/2, height/2);
  rotate(orientationRotation);
  for (i=0;i<planets.length;i++){
    planets[i].show();
    planets[i].play();
  }
  pop();

  if (webMidiCheckDone){
    if (!webMidiMade){
      makeMidiOptions();
      webMidiMade = true;
    }
  }
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
  this.touchSwitched = false;
  this.pulse = 0;
  this.trail = [new p5.Vector(this.pos.x, this.pos.y)];

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

    // pulses
    if (this.name != 'sun'){
      if (this.pulse > 0){
        this.pulse -= (0.05*this.ratio);
      } else {
        this.pulse = 0;
      }
    } else {
      if (this.on){
        this.pulse = (sin(frameCount*0.05))*0.5;
      }
    }

    push();
      rotate(this.rotation);
      translate(this.offset);

      // if touching, use that. if not, use the mouse!
      if (touchIsDown){
        this.mouseTrans = new p5.Vector(touches[0].x - width/2, touches[0].y - width/2);
      } else {
        this.mouseTrans = new p5.Vector(mouseX-width/2, mouseY-height/2);
      }
      // adjust position of our mouse with some reversing of their translation/rotation math

      this.mouseTrans.rotate(TWO_PI - orientationRotation - this.rotation);
      this.mouseTrans.sub(this.offset);
      
      // line(-this.rad, 0, this.rad, 0);

      if (this.mouseTrans.x > -this.hitbox && this.mouseTrans.x < this.hitbox && this.mouseTrans.y > -this.hitbox && this.mouseTrans.y < this.hitbox){
        this.over = true;
        if (touchIsDown && !this.touchSwitched){
          this.on = !this.on;
          this.touchSwitched = true;
        }
        // MOUSEOVER ELLIPSE
        push();
          fill(dark);
          stroke(255);
          ellipse(0, 0, this.diameter+20);
        pop();
      } else {
        this.over = false;
      }

      // REGULAR PLANET ELLIPSE
      push();
        if (this.on){
          fill(255);
        } else {
          fill(dark);
        }
        stroke(255);
        // ellipse(0, 0, this.diameter);
        ellipse(0, 0, this.diameter + (this.pulse*6));
      pop();

      // TRAIL
      // push();
      //   noFill();
      //   stroke(255);
      //   if (this.on){
      //     var newTrailVector = new p5.Vector(this.offset.x, this.offset.y);
      //     newTrailVector.sub(this.offset);
      //     this.trail.push(newTrailVector);
          
      //     for (k=0;k<this.trail.length;k++){
      //       this.trail[k].add(this.offset);
      //       this.trail[k].rotate(-this.ratio*speed);
      //       this.trail[k].sub(this.offset);
      //     }
      //     console.log(this.trail);
      //   } else {
      //     if (this.trail.length > 0){
      //       this.trail.shift();
      //     }
      //   }
      //   if (this.trail.length > 100*(1/this.ratio)){
      //     this.trail.shift();
      //   }
      //   if (this.trail.length > 2){
      //     for(j=1;j<this.trail.length;j++){
      //       strokeWeight(j/10);
      //       line(this.trail[j].x, this.trail[j].y, this.trail[j-1].x, this.trail[j-1].y);
      //     }
      //   }
      // pop();

    pop();
  };

  this.play = function(){
    if (this.on && this.name != "sun"){
      this.delta = ((this.delta + (deltaTime/100)) % ((mercuryBPM)/this.ratio));
      // console.log(floor(this.delta));

      if (floor(this.delta) == 0 && this.trigger == false){

        triggerNote(this.index);
        this.pulse = 1;
        this.trigger = true;
      }
  
      if (this.delta > 1 && this.trigger == true){
        this.trigger = false;
      }
    } else {
      if (this.on){
        this.pulse = 0;
      }
    }

  };

};

function mousePressed() {
  userStartAudio();
  getAudioContext().resume();

  for (i=0;i<planets.length;i++){
    if (planets[i].over){
      planets[i].on = !planets[i].on;
      planets[i].delta = 0;

      if (planets[i].name == "sun"){
        var output = planets[i].midiOutput;
        var channel = planets[i].midiChannel;
        
        if (planets[i].on){
          for (i=8;i<12;i++){
            envelopes[i].triggerAttack();
          }
          // SEND MIDI DRONE START
          if (webMidiSupported){
            for (j=8;j<10;j++){
              WebMidi.outputs[output].playNote(notes[j].x, channel);
              WebMidi.outputs[output].playNote(notes[j].y, channel);
            }
          }
        } else {
          for (i=8;i<12;i++){
            envelopes[i].triggerRelease();
          }
          // SEND MIDI DRONE STOP
          if (webMidiSupported){
            for (j=8;j<10;j++){
              WebMidi.outputs[output].stopNote(notes[j].x, channel);
              WebMidi.outputs[output].stopNote(notes[j].y, channel);
            }
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

  if (webMidiSupported){
    WebMidi.outputs[planets[c].midiOutput].playNote(note, planets[c].midiChannel, {duration: 10});
  }
  planets[c].activeNote = (planets[c].activeNote + 1) % 2;
}


function bpmSliderChange(){
  speed = map(bpmSlider.value, bpmSlider.min, bpmSlider.max, 0.005, 0.02);
  mercuryBPM = (bpmSlider.max - (bpmSlider.value-bpmSlider.min)) * 0.01;
  // console.log(mercuryBPM);
  // console.log("bpm changed to: " + mercuryBPM*100);

}

function volumeSliderChange(){
  volume = map(volumeSlider.value, 0, 100, 0, 1);
  masterVolume(volume);
}

function attackSliderChange(){
  attack = map(attackSlider.value, 0, 100, 0, 0.3);
  for(i=0;i<envelopes.length;i++){
    if (i < 8){
      envelopes[i].setRange(0.5, 0);
      envelopes[i].setADSR(attack, decay, sustain, release + i*0.1);
    } else {
      envelopes[i].setRange(0.15, 0);
      envelopes[i].setADSR(1, 1, 0.5, 1);
      
    }
    console.log("attack time changed to: " + attack);
  }
}

function releaseSliderChange(){
  release = map(releaseSlider.value, 0, 100, 0, 1);
  for(i=0;i<envelopes.length;i++){
    if (i < 8){
      envelopes[i].setRange(0.5, 0);
      envelopes[i].setADSR(attack, decay, sustain, release + i*0.1);
    } else {
      envelopes[i].setRange(0.15, 0);
      envelopes[i].setADSR(1, 1, 0.5, 1);
    }
    console.log("release time changed to: " + release);
  }
}

function filterSliderChange(){
  filterFreq = map(filterSlider.value, 0, 100, 100, 2200);
  filterRes = map(resSlider.value, 0, 100, 0.01, 50);
  console.log("" + filterFreq + ", " + filterRes);
  filter.set(filterFreq, filterRes);
}

function transposeSliderChange(){
  stopSunMidi();
  
  var middle = (transposeSlider.max - transposeSlider.min) * 0.5;
  var transposeVector = new p5.Vector(transposeSlider.value-middle, transposeSlider.value-middle);

  for (i=0;i<notes.length;i++){
    var newX = midiScale.findIndex(n => n === notes[i].x);
    var newY = midiScale.findIndex(n => n === notes[i].y);
    notes[i] = new p5.Vector(dMajScale[newX]+transposeVector.x, dMajScale[newY] + transposeVector.y);
  }

  for (j=0;j<midiScale.length;j++){
    midiScale[j] = dMajScale[j] + transposeVector.x;
  }

  remapSunPitches();
  startSunMidi();
  
}

function transposeKeyShow(){
  transposeP.innerHTML = ("transpose: " + transposeKeys[transposeSlider.value%transposeKeys.length]);
}

function transposeKeyHide(){
  transposeP.innerHTML = ("transpose");
}



function startSunMidi(){
  // SEND MIDI DRONE START
  var theSun = planets[planets.length-1];
    if (webMidiSupported && theSun.on){
      for (j=8;j<10;j++){
        WebMidi.outputs[theSun.midiOutput].playNote(notes[j].x, theSun.midiChannel);
        WebMidi.outputs[theSun.midiOutput].playNote(notes[j].y, theSun.midiChannel);
      }
    }
}

function stopSunMidi(){
  // SEND MIDI DRONE STOP
  var theSun = planets[planets.length-1];
  // theSun.on = false;
    if (webMidiSupported && theSun.on){
      for (j=8;j<10;j++){
        WebMidi.outputs[theSun.midiOutput].stopNote(notes[j].x, theSun.midiChannel);
        WebMidi.outputs[theSun.midiOutput].stopNote(notes[j].y, theSun.midiChannel);
      }
    }
  
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
    resizeCanvas(750, windowHeight);
    orientationRotation = 0;
  } else {
    resizeCanvas(windowWidth, 750);
    orientationRotation = HALF_PI;
  }
}

function touchStarted(){
  touchIsDown = true;
  userStartAudio();
  getAudioContext().resume();


  for (i=0;i<planets.length;i++){

    if (planets[i].over){

      if (planets[i].name == "sun"){
        var output = planets[i].midiOutput;
        var channel = planets[i].midiChannel;
        
        if (planets[i].on){
          for (i=8;i<12;i++){
            envelopes[i].triggerAttack();
          }
          // SEND MIDI DRONE START
          if (webMidiSupported){
            for (j=8;j<10;j++){
              WebMidi.outputs[output].playNote(notes[j].x, channel);
              WebMidi.outputs[output].playNote(notes[j].y, channel);
            }
          }
        } else {
          for (i=8;i<12;i++){
            envelopes[i].triggerRelease();
          }
          // SEND MIDI DRONE STOP
          if (webMidiSupported){
            for (j=8;j<10;j++){
              WebMidi.outputs[output].stopNote(notes[j].x, channel);
              WebMidi.outputs[output].stopNote(notes[j].y, channel);
            }
          }
        }
      }
    }
  }

}

function touchEnded(){
  touchIsDown = false;

  for (i=0;i<planets.length;i++){
    planets[i].touchSwitched = false;
  }
}

function intervalSelector(){
  
  stopSunMidi();
  
  var intervalVal = intervalSelect.value;
  var base = notes[0];
  var newNotes = [];
  var ind = 0;

  if (intervalVal == 3){
    // FIFTHS
    console.log('new interval: fifths!');
    for (i=0;i<notes.length;i++){
      ind = midiScale.findIndex(n => n === notes[i].y);
      notes[i].x = midiScale[ind+4];
    }
  } else if (intervalVal == 2){
    // FOURTHS
    console.log('new interval: fourths!');
    for (i=0;i<notes.length;i++){
      ind = midiScale.findIndex(n => n === notes[i].y);
      notes[i].x = midiScale[ind+3];
    }

  } else if (intervalVal == 1){
    // THIRDS
    console.log('new interval: thirds!');
    for (i=0;i<notes.length;i++){
      ind = midiScale.findIndex(n => n === notes[i].y);
      notes[i].x = midiScale[ind+2];
    }
  } else if (intervalVal == 0){
    // SECONDS
    console.log('new interval: seconds!');
    for (i=0;i<notes.length;i++){
      ind = midiScale.findIndex(n => n === notes[i].y);
      notes[i].x = midiScale[ind+1];
    }
  }  else if (intervalVal == 4){
    // SIXTHS
    console.log('new interval: sixths!');
    for (i=0;i<notes.length;i++){
      ind = midiScale.findIndex(n => n === notes[i].y);
      notes[i].x = midiScale[ind+5];
    }
  }  else if (intervalVal == 5){
    // SEVENTHS
    console.log('new interval: sevenths!');
    for (i=0;i<notes.length;i++){
      ind = midiScale.findIndex(n => n === notes[i].y);
      notes[i].x = midiScale[ind+6];
    }
  }  else if (intervalVal == 6){
    // OCTAVES
    console.log('new interval: octaves!');
    for (i=0;i<notes.length;i++){
      ind = midiScale.findIndex(n => n === notes[i].y);
      notes[i].x = midiScale[ind+7];
    }
  }

  remapSunPitches();
  startSunMidi();
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

function randomizer(probability){
  for (i=0;i<planets.length;i++){
    if (random() < probability){ // turn it on!
      
      if (planets[i].name == 'sun'){
        if (!planets[i].on){
          planets[i].on = true;
          for (i=8;i<12;i++){
            envelopes[i].triggerAttack();
          }
          startSunMidi();
        }
      } else {
        planets[i].on = true;
      }

     
    } else { // turn it off!
      
      if (planets[i].name == 'sun'){
        if (planets[i].on){
          stopSunMidi();
          planets[i].on = false;
          for (i=8;i<12;i++){
            envelopes[i].triggerRelease();
          }
          
        }
      } else {
        planets[i].on = false;
      }

      
    }
  }
}

function midiOutputChange(){
  WebMidi.outputs[outputDevice].sendStop();
  stopSunMidi();
  var newDevice = deviceSelector.value().charAt(0);
  outputDevice = newDevice;
  for (i=0;i<planets.length;i++){
    if (midiScope == "all"){
      if (i==0){
        console.log("midi output for all planets changed to: " + newDevice);
      }
      planets[i].midiOutput = newDevice;
    } else {
      if (midiScope == planets[i].name){
        console.log("midi output for " + midiScope + " changed to: " + newDevice);
        planets[i].midiOutput = newDevice;
      }
    }
  }
  startSunMidi();
}

function midiChannelChange(){
  WebMidi.outputs[outputDevice].sendStop();
  stopSunMidi();
  var newChannel = channelSelector.value().charAt(0);
  activeChannel = newChannel;
  for (i=0;i<planets.length;i++){
    if (midiScope == "all"){
      if (i==0){
        console.log("channel for all planets changed to: " + channelSelector.value());
      }
      planets[i].midiChannel = newChannel;
      WebMidi.outputs[planets[i].midiOutput].sendStop();
    } else {
      if (midiScope == planets[i].name){
        console.log("channel for " + midiScope + " changed to: " + channelSelector.value());
        planets[i].midiChannel = newChannel;
        WebMidi.outputs[planets[i].midiOutput].sendStop();
      }
    }
  }
  startSunMidi();
}

function midiInputChannelChange(){
  inputActiveChannel = inputChannelSelector.value();
  midiInputChange();
}

function midiInputChange(){
  
  for (i=0;i<WebMidi.inputs.length;i++){
    WebMidi.inputs[i].removeListener();
  }

  var newDevice = inputDeviceSelector.value().charAt(0);
  inputDevice = newDevice;
  var input = WebMidi.inputs[newDevice];
  console.log(input);
  input.addListener('noteon', inputActiveChannel, midiNoteInput);
  input.addListener('controlchange', inputActiveChannel, midiCCHandler);
}

function midiCCHandler(e){

  // if it's in listening mode, register new CC number in the functionMap
  if (inputCCListening){
    var currentSelector = inputCCFunctionSelect.value();
    console.log("CC mapped: " + currentSelector + ", " + e.controller.number);
    if (currentSelector == "vol"){
      inputCCFunctionMap.vol = e.controller.number;
    } else if (currentSelector == "speed"){
      inputCCFunctionMap.speed = e.controller.number;
    } else if (currentSelector == "transpose"){
      inputCCFunctionMap.transpose = e.controller.number;
    } else if (currentSelector == "interval"){
      inputCCFunctionMap.interval = e.controller.number;
    } else if (currentSelector == "randomize"){
      inputCCFunctionMap.randomize = e.controller.number;
    } else if (currentSelector == "filter"){
      inputCCFunctionMap.filter = e.controller.number;
    } else if (currentSelector == "res"){
      inputCCFunctionMap.res = e.controller.number;
    }

    listeningP.hide();
    inputCCListening = false;

  }

  // if the CC number matches a slider's functionMap value, move the slider & trigger change event

  if (inputCCFunctionMap.vol == e.controller.number){
    console.log("volume changed by CC" + e.controller.number);
    volumeSlider.value = map(e.value, 0, 127, volumeSlider.min, volumeSlider.max);
    volumeSliderChange();
  } 
  if (inputCCFunctionMap.speed == e.controller.number){
    console.log("speed changed by CC" + e.controller.number);
    bpmSlider.value = map(e.value, 0, 127, bpmSlider.min, 1000);
    bpmSliderChange();
  } 
  if (inputCCFunctionMap.transpose == e.controller.number){
    var startingVal = transposeSlider.value;
    console.log("transpose changed by CC" + e.controller.number);
    transposeSlider.value = map(e.value, 0, 127, transposeSlider.min, transposeSlider.max);
    var endingVal = transposeSlider.value;
    if (startingVal != endingVal){
      transposeSliderChange();
    }
  }
  if (inputCCFunctionMap.interval == e.controller.number){
    var startingInterval = intervalSelect.value;
    console.log("interval changed by CC" + e.controller.number);
    intervalSelect.value = round(map(e.value, 0, 127, 0, 6));
    var newInterval = intervalSelect.value;
    if (startingInterval != newInterval){
      intervalSelector();
    }
  }
  if (inputCCFunctionMap.randomize == e.controller.number){
    var randomProb = map(e.value, 0, 127, 0.1, 0.9);
    var randomProbReadable = (randomProb*10).toFixed(2);
    console.log("randomized by CC" + e.controller.number + " with probability " + randomProbReadable + "/10");
    randomizer(randomProb);
  }
  if (inputCCFunctionMap.filter == e.controller.number){
    console.log("filter changed by CC" + e.controller.number);
    filterSlider.value = map(e.value, 0, 127, filterSlider.min, filterSlider.max);
    filterSliderChange();
  }
  if (inputCCFunctionMap.res == e.controller.number){
    console.log("filter changed by CC" + e.controller.number);
    resSlider.value = map(e.value, 0, 127, resSlider.min, resSlider.max);
    filterSliderChange();
  }
}

function midiNoteInput(e){
  var currentKeyboardMap = keyboardMapSelector.value();
  var num = e.note.number;

  console.log('played: ' + e.note.name + e.note.octave + ", " + e.note.number);

  if (num != notes[8].x && num != notes[8].y && num != notes[9].x && num != notes[9].y){
    if (currentKeyboardMap == 'toggle planets'){
      var c = 60;
      var val = (c + num)%12;
      for (i=0;i<12;i++){
        if (i<8){
          if (val == i){
            planets[i].on = !planets[i].on;
          }
        } else {
          if (val == i){
            if (planets[8].on != true){
              planets[8].on = !planets[8].on;
              for (i=8;i<12;i++){
                envelopes[i].triggerAttack();
              }
              startSunMidi();
            } else {
              stopSunMidi();
              planets[8].on = !planets[8].on;
              for (i=8;i<12;i++){
                envelopes[i].triggerRelease();
              }
            }
          }
        }
      }

    } else if (currentKeyboardMap == 'transpose'){
      
        var base = 62;
        var middle = (transposeSlider.max - transposeSlider.min)*0.5;
        transposeSlider.value = middle + ((num - base));
        transposeSliderChange();
    }
  }
}

function inputCCFunctionChange(){
  inputCCListening = true;
  console.log('changed, listening for CC input');
  // inputCCFunctionLabel.html("CC map: listening");
  listeningP.show();
}

function keyboardMapChange(){

}

function makeMidiOptions(){

  // var divider = createP("~ ~ ~");
  // divider.parent(midiParent);

  if (webMidiSupported){
    
    // MIDI OUT

    midiOutLabel = createP("midi out");
    midiOutLabel.parent(midiParent);

    // SCOPE

    // scopeLabel = createP("midi scope");
    // scopeLabel.parent(midiParent);

    scopeSelector = createSelect();
    scopeSelector.parent(midiParent);
    scopeSelector.option("~ scope ~");
    scopeSelector.disable("~ scope ~");

    scopeSelector.option("all");

    for(i=0;i<planets.length;i++){
      scopeSelector.option("" + planets[i].name);
    }
    midiScope = 'all';
    scopeSelector.changed(midiScopeChange);


    // OUTPUT DEVICE

    // deviceLabel = createP("output device");
    // deviceLabel.parent(midiParent);
    
    deviceSelector = createSelect();
    deviceSelector.parent(midiParent);
    deviceSelector.id('halfsize');

    deviceSelector.option('~device~');
    deviceSelector.disable('~device~');
    deviceSelector.changed(midiOutputChange);

    for (i=0;i<WebMidi.outputs.length;i++){
      var name = WebMidi.outputs[i]._midiOutput.name;
      devices[i] = "" + i + " " + name;
      deviceSelector.option(devices[i]);
    }
    outputDevice = 0;

    // OUT CHANNEL

    // channelLabel = createP("channel");
    // channelLabel.parent(midiParent);

    channelSelector = createSelect();
    channelSelector.id('halfsize');
    channelSelector.parent(midiParent);

    channelSelector.option('~channel~');
    channelSelector.disable('~channel~');
    
    for (j=0;j<8;j++){
      channelSelector.option(j+1);
    }
    channelSelector.changed(midiChannelChange);
    activeChannel = 1;

    // clockCheckbox = createCheckbox(' send clock', false);
    // clockCheckbox.parent(midiParent);
    // clockCheckbox.class("checkbox");
  
    // MIDI INPUT

    midiInputLabel = createP("midi in");
    midiInputLabel.parent(midiParent);

    //INPUT DEVICE

    // inputDeviceLabel = createP("input device");
    // inputDeviceLabel.parent(midiParent);
    
    inputDeviceSelector = createSelect();
    inputDeviceSelector.parent(midiParent);
    inputDeviceSelector.id('halfsize');

    inputDeviceSelector.option('~device~');
    inputDeviceSelector.disable('~device~');
    inputDeviceSelector.changed(midiInputChange);

    for (i=0;i<WebMidi.inputs.length;i++){
      var inputName = WebMidi.inputs[i]._midiInput.name;
      inputDevices[i] = "" + i + " " + inputName;
      inputDeviceSelector.option(devices[i]);
    }
    inputDevice = 0;
  
  
  // IN CHANNEL

    // inputChannelLabel = createP("channel");
    // inputChannelLabel.parent(midiParent);

    inputChannelSelector = createSelect();
    inputChannelSelector.parent(midiParent);
    inputChannelSelector.id('halfsize');

    inputChannelSelector.option('~channel~');
    inputChannelSelector.disable('~channel~');
    
    for (j=0;j<8;j++){
      inputChannelSelector.option(j+1);
    }
    inputChannelSelector.changed(midiInputChannelChange);
    inputActiveChannel = 1;
    
    
    // IN CC
    
    
    // IN CC FUNCTION

    inputCCFunctionSelect = createSelect();
    
    inputCCFunctionSelect.option('~ CC map ~');
    inputCCFunctionSelect.disable('~ CC map ~');
    inputCCFunctionSelect.option('vol');
    inputCCFunctionSelect.option('speed');
    inputCCFunctionSelect.option('transpose');
    inputCCFunctionSelect.option('randomize');
    inputCCFunctionSelect.option('interval');
    inputCCFunctionSelect.option('filter');
    inputCCFunctionSelect.option('res');
    
    inputCCFunctionSelect.changed(inputCCFunctionChange);
    inputCCListening = false;
    inputCCFunctionMap = [
        {vol: 0},
        {speed: 0},
        {transpose: 0},
        {randomize: 0},
        {interval: 0},
        {filter: 0},
        {res: 0}
    ];
    
    inputCCFunctionSelect.parent(midiParent);
    inputCCVal = 1;

    listeningP = createP('listening for CC');
    listeningP.parent(midiParent);
    listeningP.hide();

    // KEYBOARD MAP

    keyboardMapSelector = createSelect();
    keyboardMapSelector.option('~ keyboard map ~');
    keyboardMapSelector.disable('~ keyboard map ~');
    keyboardMapSelector.option('toggle planets');
    keyboardMapSelector.option('transpose');

    keyboardMapSelector.changed(keyboardMapChange);

    keyboardMapSelector.parent(midiParent);
  } else {
    var outro = select("#outro");
    var differentBrowser = createP("this instrument supports web midi! looks like your browser doesn't though :( come back in chrome to try it out");
    differentBrowser.parent(midiParent);
  }
}

function controlsToggle(){
  var controls = select("#controlsInner");
  var toggle = select("#controlsToggle");
  if (controls.style('max-height') == "0px"){
    toggle.html("- controls");
    controls.style('max-height', '1000px');
  } else {
    toggle.html("+ controls");
    controls.style('max-height', '0px');
  }
}

function midiToggle(){
  var controls = select("#midiOptions");
  var toggle = select("#midiToggle");
  if (controls.style('max-height') == "0px"){
    toggle.html("- midi");
    controls.style('max-height', '1000px');
  } else {
    toggle.html("+ midi");
    controls.style('max-height', '0px');
  }
}

function outroToggle(){
  var outro = select("#outro");
  var toggle = select("#outroToggle");
  if (outro.style('max-height') == "0px"){
    toggle.html("- about");
    outro.style('max-height', '1000px');
  } else {
    toggle.html("+ about");
    outro.style('max-height', '0px');
  }
}

