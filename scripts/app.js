// set up basic variables for app
var record = document.querySelector('.record');
var stop = document.querySelector('.stop');
var enableMic = document.querySelector('.enableMic');
var enableSynth = document.querySelector('.enableSynth');
var soundClips = document.querySelector('.sound-clips');
var canvas = document.querySelector('.visualizer');
var mainSection = document.querySelector('.main-controls');
var playAll = document.querySelector('#playAll');
var pauseAll = document.querySelector('#pauseAll');
var synthMode = false;
var micStream;
var waveArr = [];
// disable stop button while not recording

stop.disabled = true;

// visualiser setup - create web audio api context and canvas

var audioCtx = new (window.AudioContext || webkitAudioContext)();
var canvasCtx = canvas.getContext("2d");

//main block for doing the audio recording

if (navigator.mediaDevices.getUserMedia) {
  console.log('getUserMedia supported.');

  var constraints = { audio: true };
  var chunks = [];

  var onSuccess = function(stream) {

    enableSynth.onclick = function() {
      synthMode = true;
      console.log("synth mode enabled!");
      enableSynth.style.background = "LimeGreen";
      enableMic.style.background = "";
      enableMic.disabled = false;
      enableSynth.disabled = true;

      var dest = webSynth.audioCtx.createMediaStreamDestination();
      webSynth.voices.forEach(function(voice){
        voice.amp.connect(dest);
      })
      visualize(dest.stream);
      onSuccess(dest.stream);
    }

    enableMic.onclick = function() {
      synthMode = false;
      console.log("Mic mode enabled!");
      enableMic.style.background = "LimeGreen";
      enableSynth.style.background = "";
      enableSynth.disabled = false;
      enableMic.disabled = true;
      onSuccess(micStream);
    }

    var mediaRecorder = new MediaRecorder(stream);
    visualize(stream);

    record.onclick = function() {
      mediaRecorder.start();
      console.log("synthMode", synthMode)
      console.log(mediaRecorder.state);
      console.log("recorder started");
      record.style.background = "red";

      stop.disabled = false;
      record.disabled = true;
    }

    stop.onclick = function() {
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
      console.log("recorder stopped");
      record.style.background = "";
      record.style.color = "";
      // mediaRecorder.requestData();

      stop.disabled = true;
      record.disabled = false;
    }

    mediaRecorder.onstop = function(e) {
      console.log("data available after MediaRecorder.stop() called.");

      var clipName = prompt('Enter a name for your sound clip?','My unnamed clip');
      console.log(clipName);
      var clipContainer = document.createElement('article');
      var clipLabel = document.createElement('p');
      var audio = document.createElement('audio');
      var deleteButton = document.createElement('button');

      clipContainer.classList.add('clip');
      audio.setAttribute('controls', '');
      deleteButton.textContent = 'Delete';
      deleteButton.className = 'delete';

      if(clipName === null) {
        clipLabel.textContent = 'My unnamed clip';
      } else {
        clipLabel.textContent = clipName;
      }

      clipContainer.appendChild(audio);
      clipContainer.appendChild(clipLabel);
      clipContainer.appendChild(deleteButton);
      soundClips.appendChild(clipContainer);

      audio.controls = true;
      var blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
      chunks = [];
      var audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;
      console.log("recorder stopped");

      deleteButton.onclick = function(e) {
        evtTgt = e.target;
        waveArr = waveArr.filter(function(wave) {
          return +wave.container.id !== +evtTgt.parentNode.lastChild.firstChild.id;
        })
        evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
      }

      clipLabel.onclick = function() {
        var existingName = clipLabel.textContent;
        var newClipName = prompt('Enter a new name for your sound clip?');
        if(newClipName === null) {
          clipLabel.textContent = existingName;
        } else {
          clipLabel.textContent = newClipName;
        }
      }
    var waveform = document.createElement('div');
    waveform.id = Math.random();
    var wavesurfer = WaveSurfer.create({
      container: waveform,
      fillParent: false
    });
    var waveformTimeline = document.createElement('div');
    clipContainer.appendChild(waveformTimeline);
    waveformTimeline.appendChild(waveform);
  var tracksArr = document.querySelectorAll('audio');
  wavesurfer.load(tracksArr[tracksArr.length-1].src);
    console.log('wavesurfer', wavesurfer, "trackslength", tracksArr.length-1);
  wavesurfer.on('ready', function () {
    var timeline = Object.create(WaveSurfer.Timeline);
      timeline.init({
        wavesurfer: wavesurfer,
        container: waveformTimeline
      });
    wavesurfer.setMute(true);
    wavesurfer.play();

  });
    waveArr.push(wavesurfer);

    }

    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    }
  }

  var onError = function(err) {
    console.log('The following error occured: ' + err);
  }

  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    micStream = stream;
    onSuccess(stream)
  })
  .catch(function(err){
    onError(err)
  });

} else {
   console.log('getUserMedia not supported on your browser!');
}

function visualize(stream) {
  var source = audioCtx.createMediaStreamSource(stream);

  var analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  var bufferLength = analyser.frequencyBinCount;
  var dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  //analyser.connect(audioCtx.destination);

  draw()

  function draw() {
    WIDTH = canvas.width
    HEIGHT = canvas.height;

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    var sliceWidth = WIDTH * 1.0 / bufferLength;
    var x = 0;


    for(var i = 0; i < bufferLength; i++) {

      var v = dataArray[i] / 128.0;
      var y = v * HEIGHT/2;

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height/2);
    canvasCtx.stroke();

  }
}

window.onresize = function() {
  canvas.width = mainSection.offsetWidth;
}

window.onresize();

playAll.onclick = function() {
console.log("WA", waveArr);
  for (var i = 0; i < waveArr.length; i++){
    waveArr[i].setMute(false);
  }
  for (var i = 0; i < waveArr.length; i++){
    waveArr[i].play();
  }

}

pauseAll.onclick = function() {
  for (var i = 0; i < waveArr.length; i++){
    waveArr[i].pause();
  }
}
//create a synth and connect it to the master output (your speakers)
var synth = new Tone.Synth().toMaster();
Tone.Transport.bpm.value = 270;
//play a middle 'C' for the duration of an 8th note
//synth.triggerAttackRelease("D4", "8n");
// synth.triggerAttackRelease("D4", "8n");
//play a note every quarter-note
//var time = 1;
// var loop = new Tone.Loop(function(time){
//   synth.triggerAttackRelease("D2", "8n", time);
// }, "4n");

// loop.start("0m").stop("4m");

var loop1 = new Tone.Loop(function(time){
  synth.triggerAttackRelease("B4", "16n", time);
}, "8n");
loop1.start("5m").stop("5:2:1");

var part = new Tone.Part(function(time, pitch){
	synth.triggerAttackRelease(pitch, "8n", time);
}, [["0:0", "C4"], ["0:1", "G3"], ["0:2", "C3"], ["0:3", "G3"], ["0:4", "C3"]]);

part.start("4m");

var part = new Tone.Part(function(time, pitch){
	synth.triggerAttackRelease(pitch, "8n", time);
}, [["0:0", "C4"], ["0:1", "G3"], ["0:2", "C3"], ["0:3", "G2"], ["0:4", "C2"]]);

part.start("6m");

//cycle up and then down the array of values
var arp = new Tone.Pattern(function(time, pitch) {
  synth.triggerAttackRelease(pitch, "4n", time);
}, ["C3", "E3", "G3", "B3"], "upDown");
//callback order: "C3", "E3", "G3", "E3", ...repeat

arp.pattern = "downUp";
arp.start("1m").stop("4m");
//callback order: "G3", "E3", "C3", "E3", ...repeat



//NEXUSUI
console.log(Nexus, "nexus")
var textbuttonPlay = new Nexus.TextButton('#play-tone',{
  'size': [150,50],
  'text': 'Play'
})

var textbuttonStop = new Nexus.TextButton('#stop-tone',{
  'size': [150,50],
  'text': 'Stop'
})

var textbuttonPause = new Nexus.TextButton('#pause-tone',{
  'size': [150,50],
  'text': 'Pause'
})

textbuttonPlay.on('change',function(v) {

  Tone.Transport.start();
})

textbuttonStop.on('change',function(v) {

    Tone.Transport.stop();
  })

textbuttonPause.on('change',function(v) {

      Tone.Transport.pause();
    })
textbuttonPause.colorize("fill","#ff0")
textbuttonPlay.colorize("fill","#ff0")
textbuttonStop.colorize("fill","#ff0")

 /* SEQUENCER */

// var sequencer = new Nexus.Sequencer('#seq');

var sequencer = new Nexus.Sequencer('#seq',{
  'size': [600,450],
  'mode': 'toggle',
  'rows': 12,
  'columns': 16
 })
 sequencer.colorize("accent","#ff0")
 sequencer.colorize("fill","#111")
// var tone = document.querySelector("#tone");
// tone.appendChild(textbutton);


// Create interfaces
var power = new Nexus.Toggle("#power");
var delay = new Nexus.Slider("#echo");
power.colorize("fill","#997");
delay.colorize("fill","#997");
// Create a sound source using Tone.js
var synth = new Tone.Oscillator(0,"sine").start();
var volume = new Tone.Volume(-Infinity);
var delayGen = new Tone.FeedbackDelay(0.2,0.7);
synth.chain( delayGen, volume, Tone.Master );

// Customize interface &
// Add event listeners
delay.min = 0;
delay.max = 0.7;
delay.on('change',function(value) {
	delayGen.wet.value = value;
})
delay.value = 0.4;

power.on('change',function(v) {
	volume.volume.cancelScheduledValues();
	var level = v ? -20 : -Infinity;
	volume.volume.rampTo(level,3)
})

// Create a sequence of note values
var sequence = new Nexus.Sequence([ -7, -4, -1, 0,2,4,6,8,9,11,13,15,19,21]);

// Create a repeating pulse
// Change notes on each beat
var beat = new Nexus.Interval(400,function(e) {
	synth.frequency.value = Nexus.note( sequence.next(), -1 );
});

beat.start();
