var canvWidth, canvHeight;
var c, cParent;

var webMidiSupported, midiParent;

var sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune;

var planets = [];

var speed;

var dark;

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

  midiParent = document.getElementById('midiOptions');

  if (webMidiSupported){
    
  }

  sun = new Planet(0, 70, 0, "sun");
  mercury = new Planet(50, 10, 1, "mercury");
  venus = new Planet(75, 15, 0.7414966, "venus");
  earth = new Planet(100, 20, 0.6292517, "earth");
  mars = new Planet(125, 15, 0.51020408, "mars");
  jupiter = new Planet(200, 50, 0.2755102, "jupiter");
  saturn = new Planet(250, 40, 0.20408163, "saturn");
  uranus = new Planet(300, 30, 0.14285714, "uranus");
  neptune = new Planet(350, 20, 0.11564626, "neptune");
  planets.push(sun);
  planets.push(mercury);
  planets.push(venus);
  planets.push(earth);
  planets.push(mars);
  planets.push(jupiter);
  planets.push(saturn);
  planets.push(uranus);
  planets.push(neptune);

  speed = 0.01;

  dark = color(15, 15, 19);
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
  }
  pop();
}

var Planet = function(offset, diameter, ratio, name){
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
  this.on = true;
  this.over = false;

  this.show = function(){

    if (this.on){
      this.rotation += (this.ratio*speed);
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
    }
  }
}


function playVoice(x, y){
  let note = notes[x];

  envelopes[x][y].triggerAttack();
  // synths[x][y].amp(0.3, 0.0001);

  if (webMidiSupported && scaleVal != 0){
    if (activeChannel != "r"){
      WebMidi.outputs[outputDevice].playNote(notes[x+(rows-y-1)] + noteOffset, activeChannel);
    } else {
      WebMidi.outputs[outputDevice].playNote(notes[x+(rows-y-1)] + noteOffset, rows-y);
    }
  }
}

function releaseVoice(x, y){
  let note = notes[x];

  envelopes[x][y].triggerRelease();
  // synths[x][y].amp(0, 0.0001);
  if (webMidiSupported && scaleVal != 0){
    if (activeChannel != "r"){
      WebMidi.outputs[outputDevice].stopNote(notes[x+(rows-y-1)], activeChannel);
    } else {
      WebMidi.outputs[outputDevice].stopNote(notes[x+(rows-y-1)], rows-y);
    }
  }
}

function speedSliderChange(){
  speed = floor(101-speedSlider.value);
}

function volumeSliderChange(){
  volume = map(volumeSlider.value, 0, 100, 0, 1);
  masterVolume(volume);
}

function detuneSliderChange(){
  pitchSpread = map(ySlider.value, 0, 100, 0, 10);
  remapNotes();
}

function filterSliderChange(){
  var frequency = map(filterSlider.value, 0, 100, 100, 1100);
  filter.freq(frequency);
}

function transposeSliderChange(){
  if (webMidiSupported && generation > 0){
    WebMidi.outputs[outputDevice].sendStop();
  }
  if (scaleVal == 0){
    if (transposeSlider.value <= 12){
      noteOffset = map(transposeSlider.value, 0, 12, 0.5, 1);
    } else if (transposeSlider.value > 12){
      noteOffset = map(transposeSlider.value, 12, 24, 1, 2);
    } else {
      noteOffset = 1;
    }
  } else {
    noteOffset = map(transposeSlider.value, 0, 24, -12, 12);
  }
  remapNotes();

}

function remapNotes(){


  if (scaleVal != 0){

    for (i=0;i<notes.length;i++){
      while (notes[i] > 127){
        notes[i] -= 12;
      }
      
      while (notes[i] < 0){
        notes[i] += 12;
      }
    }

    for (i=0;i<columns;i++){
      for (j=0;j<rows;j++){
        synths[i][j].freq(midiToFreq(notes[i+(rows-j-1)] + noteOffset) + (random(-1, 1)*pitchSpread));
      }
    }
  } else {
    for (i=0;i<columns;i++){
      for (j=0;j<rows;j++){
        // synths[i][j].freq(notes[i+(rows-j-1)] + (random(-1, 1)*pitchSpread));
        synths[i][j].freq(notes[i+(rows-j-1)]*noteOffset);
      }
    }
  }
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

function scaleSelector(scaleRadio){
  scaleVal = scaleRadio.value;
  var interval = 1;
  var base = notes[0];
  var newNotes = [];

  if (scaleVal == 0){
    noteOffset = 1;
   makeMicroNotes();
      
  } else if (scaleVal == 1){
    // CHROMATIC
    notes = [48, 49, 50, 51, 52, 53, 54, 
            55, 56, 57 ,58 ,59 ,60, 61,
            62, 63, 64, 65, 66, 67, 68,
            69, 70, 71];

  } else if (scaleVal == 2){
    // DIATONIC
    notes = [48, 50, 52, 53, 55, 57, 59, 
      60, 62, 64, 65, 67, 69, 71, 
      72, 74, 76, 77, 79, 81, 83, 
      84, 86, 88];
  } else if (scaleVal == 3){
    // WHOLETONE
    notes[0] = 48;
    for (i=1;i<25;i++){
      notes[i] = (notes[i-1]) + 2;
    }
  } else if (scaleVal == 4){
    // PENTATONIC
    notes = [36, 38, 40, 43, 45];
    for (i=5;i<25;i++){
      notes[i] = (notes[i-5]) + 12;
    }
  } else if (scaleVal == 5){
    // MAJ 7
    notes = [36, 38, 40, 43, 47];
    for (i=5;i<25;i++){
      notes[i] = (notes[i-5]) + 12;
    }
  } else if (scaleVal == 6){
    // MIN 7
    notes = [36, 39, 43, 46];
    for (i=4;i<25;i++){
      notes[i] = (notes[i-4]) + 12;
    }
  } else if (scaleVal == 7){
    // FOURTHS
    notes[0] = 36;
    for (i=1;i<25;i++){
      notes[i] = (notes[i-1]) + 5;
    }
  }  else if (scaleVal == 8){
    // FIFTHS
    notes[0] = 12;
    for (i=1;i<25;i++){
      notes[i] = (notes[i-1]) + 7;
    }
  }

  remapNotes();

}

function oscSelector(newOsc){
  var newOsc = newOsc.value;

  for (i=0;i<columns;i++){
    for (j=0;j<rows;j++){
      synths[i][j].setType(newOsc);
    }
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

function midiOutputChange(){
  var newDevice = deviceSelector.value().charAt(0);
  console.log("midi output device changed to: " + newDevice);
  outputDevice = newDevice;
}

function midiChannelChange(){
  WebMidi.outputs[outputDevice].sendStop();
  var newChannel = channelSelector.value().charAt(0);
  console.log("output channel changed to: " + channelSelector.value());
  activeChannel = newChannel;
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

function cellCountDisplay() {
    var text = "" + cellCount + " living cells" + " ~ " + generation + " generations";
    cellCountP.innerHTML = text;
}
