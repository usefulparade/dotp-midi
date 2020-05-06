let w, canvWidth, canvHeight;
let c, cParent;

var webMidiSupported;

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

  context = getAudioContext();
  context.suspend();

  noteOffset = 0;

  scaleVal = 2;

  if (windowWidth > 640){
    canvWidth = 640;
    canvHeight = 320;
    w = 40;
  } else {
    canvWidth = windowWidth;
    canvHeight = (canvWidth/16)*8;
    w = canvWidth/16;
  }

  c = createCanvas(canvWidth, canvHeight);
  cParent = document.getElementById("game");
  c.parent(cParent);

  // Calculate columns and rows
  columns = floor(width / w);
  rows = floor(height / w);

  // Wacky way to make a 2D array in JS
  board = new Array(columns);
  for (let i = 0; i < columns; i++) {
    board[i] = new Array(rows);
  }
  
  // Going to use multiple 2D arrays and swap them
  next = new Array(columns);
  for (i = 0; i < columns; i++) {
    next[i] = new Array(rows);
  }

  for (let i = 0; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
      board[i][j] = 0;
      next[i][j] = 0;
    }
  }
  
  notes = [48, 50, 52, 53, 55, 57, 59, 
          60, 62, 64, 65, 67, 69, 71, 
          72, 74, 76, 77, 79, 81, 83, 
          84, 86, 88];

  filter = new p5.LowPass();
  filter.freq(1100);
  filter.res(10);

  synths = new Array(columns);
  for (i = 0;i<columns;i++){
    synths[i] = new Array(rows);
  }

  envelopes = new Array(columns);
  for (i = 0;i<columns;i++){
    envelopes[i] = new Array(rows);
  }

  for (j=0; j<columns; j++){
    for (k=0;k<rows;k++){
      synths[j][k] = new p5.Oscillator();
      synths[j][k].setType("triangle");
      synths[j][k].freq(midiToFreq(notes[j]) * random(-1,1)*2);
      
      synths[j][k].start();

      envelopes[j][k] = new p5.Envelope()
      envelopes[j][k].setADSR(0.005, 0.5, 0.07, 0.01);
      envelopes[j][k].setRange(0.5, 0);
      synths[j][k].amp(envelopes[j][k]);
      synths[j][k].disconnect();
      synths[j][k].connect(filter);
    }
  }

  

  speed = 30;
  speedP = document.getElementById("speedP");
  speedSlider = document.getElementById("speedSlider");
  speedSliderChange();

  volume = 0.5;
  volumeP = document.getElementById("volumeP");
  volumeSlider = document.getElementById("volumeSlider");
  volumeSliderChange();

  pitchSpread = 2;
  microInterval = 1.0293;
  pitchSlider = document.getElementById("detuneSlider");
  detuneSliderChange();

  filterSlider = document.getElementById("filterSlider");
  filterSliderChange();
  // init();
  transposeSlider = document.getElementById("transposeSlider");
  transposeSliderChange();

  midiParent = document.getElementById('midiOptions');

  

  if (webMidiSupported){
    var divider = createP("~ ~ ~");
    divider.parent(midiParent);
    deviceLabel = createP("midi output:");
    deviceLabel.parent(midiParent);
    
    deviceSelector = createSelect();
    deviceSelector.parent(midiParent);
    // channelSelector.addClass("select");

    deviceSelector.option('~ choose output ~');
    deviceSelector.disable('~ choose output ~');
    deviceSelector.changed(midiOutputChange);

    for (i=0;i<WebMidi.outputs.length;i++){
      var name = WebMidi.outputs[i]._midiOutput.name;
      devices[i] = "" + i + " " + name;
      deviceSelector.option(devices[i]);
    }
    outputDevice = 0;

    channelLabel = createP("channel:");
    channelLabel.parent(midiParent);

    channelSelector = createSelect();
    channelSelector.parent(midiParent);
    // channelSelector.addClass("select");
    
    for (j=0;j<8;j++){
      channelSelector.option(j+1);
    }

    channelSelector.option("rows --> channels");
    channelSelector.changed(midiChannelChange);
    activeChannel = 1;
    clockCount = 0;

    clockCheckbox = createCheckbox(' send clock', false);
    clockCheckbox.parent(midiParent);
    clockCheckbox.class("checkbox");
  }

  playbtn = document.getElementById("playbtn");

  context.suspend();
  touchIsDown = false;
  paused = true;

  circleStroke = 255;
  cellCount = 0;
  generation = 0;
  cellCountP = document.getElementById("cellcount");
  cellCountP.innerHTML = "";

}

function draw() {

  background(15, 15, 19);

  if (frameCount%speed == 0){
    if (!paused){
      generate();
      // clockCount = 0;
    }
  }

  sendMidiClock();

  
  for ( let i = 0; i < columns;i++) {
    for ( let j = 0; j < rows;j++) {
      var r = w/2;
      var x = i*w+r;
      var y = j*w+r;
      
      if (mouseX > x-r && mouseX < x+r && mouseY > y-r && mouseY < y+r && board[i][j] != 1) {
        push();
          noFill();
          stroke(255);
          ellipse(i * w + w/2, j * w + w/2, w/2);
        pop();
        if (mouseIsPressed){
          if (board[i][j] == 0){
            board[i][j] = 1;
            cellCount += 1;
            playVoice(i, j);
          }
        }
      }
      else if (touchIsDown){
        if (touches[0] != null){
            if (touches[0].x > x-r && touches[0].x < x+r && touches[0].y > y-r && touches[0].y < y+r && board[i][j] != 1) {
            board[i][j] = 1;
            cellCount += 1;
            playVoice(i, j);
          }
        }
      }
      
      if ((board[i][j] == 1)) fill(circleStroke);
      else noFill();
      push();
        stroke(circleStroke);
        ellipse(i * w + w/2, j * w + w/2, w);
      pop();

    }
  }

  cellCountDisplay();
}

function mousePressed() {
  userStartAudio();
  getAudioContext().resume();
}

// Fill board randomly
function randomize() {
  frameCount = 0;
  paused = false;
  generation = 0;

  userStartAudio();
  getAudioContext().resume();

  playbtn.innerHTML = "pause";

  for (let x = 0; x<rows;x++){
    for (let y = 0; y<columns, y++;){
      synths[x][y].releaseVoice();
    }
  }

  for (let i = 0; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
      board[i][j] = floor(random(1.2));
      next[i][j] = 0;
      if (board[i][j] == 1) playVoice(i, j);
    }
  }
  if (webMidiSupported){
    if (clockCheckbox.checked()){
      WebMidi.outputs[outputDevice].sendStart();
    }
  }
}

// clear the board
function clearButton() {
  frameCount = 0;
  

  for (let i = 0; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
      board[i][j] = 0;
      next[i][j] = 0;
    }
  }

  generate();
  generation = 0;


  playbtn.innerHTML = "play";
  paused = true;

  for (let x = 0; x<rows;x++){
    for (let y = 0; y<columns, y++;){
      synths[x][y].releaseVoice();
    }
  }

  if (webMidiSupported){
      WebMidi.outputs[outputDevice].sendStop();
  }
}

// The process of creating the new generation
function generate() {
  clockCount = 0;
  cellCount = 0;
  generation++;

  // Loop through every spot in our 2D array and check spots neighbors
  for (let x = 0; x < columns; x++) {
    for (let y = 0; y < rows; y++) {

      // get cell count
      if (board[x][y] == 1){
        cellCount += 1;
      }

      // Add up all the states in a 3x3 surrounding grid
      let neighbors = 0;
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          neighbors += getNeighborWrapped(x+i, y+j);
        }
      }
      // A little trick to subtract the current cell's state since
      // we added it in the above loop
      neighbors -= board[x][y];
      // Rules of Life
      if      ((board[x][y] == 1) && (neighbors <  2)) next[x][y] = 0;           // Loneliness
      else if ((board[x][y] == 1) && (neighbors >  3)) next[x][y] = 0;           // Overpopulation
      else if ((board[x][y] == 0) && (neighbors == 3)) next[x][y] = 1;           // Reproduction
      else                                             next[x][y] = board[x][y]; // Stasis
    
    }
  }


  //play the sounds!
  for (let x2 = 0; x2 < columns; x2++) {
    for (let y2 = 0; y2 < rows; y2++) {

      
      if      ((board[x2][y2] == 0) && (next[x2][y2] == 0)) releaseVoice(x2, y2);     // 0 to 0, no change, no voice
      else if ((board[x2][y2] == 0) && (next[x2][y2] == 1)) playVoice(x2, y2);        // 0 to 1, play a note!
      else if ((board[x2][y2] == 1) && (next[x2][y2] == 0)) releaseVoice(x2, y2);     // 1 to 0, release a note!
      else if ((board[x2][y2] == 1) && (next[x2][y2] == 1)) ;                         // 1 to 1, no change, keep playing
      else                                                  ;                         // shouldn't come to this but w/e!
    }
  }
  

  // Swap!
  let temp = board;
  board = next;
  next = temp;
}

 function getNeighborWrapped(c0, r0){
    var c, r;

    if (c0 < 0) c = c0 + columns;
    else c = c0 % columns;
    if (r0 < 0) r = r0 + rows;
    else r = r0 % rows;

    return board[c][r];
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

function octUp(){
  if (scaleVal != 0){
    if (notes[notes.length-1] < 127){
      for (i=0;i<notes.length;i++){
        notes[i] += 12;
      }
    }
  } else {
    for (i=0;i<notes.length;i++){
      notes[i] = notes[i]*2;
    }
  }
  remapNotes();
}

function octDown(){
  
  for (i=0;i<notes.length;i++){
    if (scaleVal != 0){
      if (notes[0] > 0){
        notes[i] -= 12;
      }
    } else {
      notes[i] = notes[i]*0.5;
    }
  }
  remapNotes();
}

function stepUp(){

  for (i=0;i<notes.length;i++){
    if (scaleVal != 0){
      notes[i] += 1;
    } else {
      notes[i] = notes[i] * microInterval;
    }
  }
  remapNotes();
}

function stepDown(){
  for (i=0;i<notes.length;i++){
    if (scaleVal != 0){
      notes[i] -= 1;
    } else {
      notes[i] = notes[i] * (1/microInterval);
    }
  }
  remapNotes();
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
  if (windowWidth > 640){
    resizeCanvas(640, 320);
    w = 40;
  } else {
    resizeCanvas(windowWidth, (windowWidth/16)*8);
    w = windowWidth/16;
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

function playButton(){

  if (paused){
    paused = false;
    frameCount = 0;


    playbtn.innerHTML = "pause";
    userStartAudio();
    getAudioContext().resume();

    for (let x = 0; x<rows;x++){
      for (let y = 0; y<columns, y++;){
        synths[x][y].releaseVoice();
      }
    }
    
    for (let i = 0; i < columns; i++) {
      for (let j = 0; j < rows; j++) {
        board[i][j] = board[i][j];
        next[i][j] = 0;
        if (board[i][j] == 1) playVoice(i, j);
      }
    }
    if (webMidiSupported){
      if (clockCheckbox.checked()){
        WebMidi.outputs[outputDevice].sendStart();
      }
    }
  } else {
    paused = true;
    playbtn.innerHTML = "play";
  }

}

function pauseButton(){
  paused = true;
  playbtn.innerHTML = "play";
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
