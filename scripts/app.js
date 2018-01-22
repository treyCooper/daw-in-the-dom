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
var blobArr = [];
var urlArr = [];
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
        voice.amp.connect(dest)
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

    Tone.Master.mute = true;
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
      var clipLabel = document.createElement('a');
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
      console.log(waveArr, 'audiocontrols')
      var blob = new Blob(chunks, { 'type' : 'audio/ogg; codecs=opus' });
      chunks = [];
      blobArr.push(blob)
      var audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;
      clipLabel.setAttribute("href", audio.src)
      clipLabel.setAttribute("download", clipName)

      console.log(urlArr, 'url')
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
  wavesurfer.on('ready', function () {
    var timeline = Object.create(WaveSurfer.Timeline);
      timeline.init({
        wavesurfer: wavesurfer,
        container: waveformTimeline
      });
    wavesurfer.setMute(true);
    wavesurfer.play();

    Tone.Master.mute = false;
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

Tone.Transport.bpm.value = 140;
//play a middle 'C' for the duration of an 8th note
//synth.triggerAttackRelease("D4", "8n");
// synth.triggerAttackRelease("D4", "8n");
//play a note every quarter-note
//var time = 1;
// var loop = new Tone.Loop(function(time){
//   synth.triggerAttackRelease("D2", "8n", time);
// }, "4n");

// loop.start("0m").stop("4m");

// var loop1 = new Tone.Loop(function(time){
//   synthTone.triggerAttackRelease("B4", "16n", time);
// }, "8n");
// loop1.start("5m").stop("5:2:1");

// var part = new Tone.Part(function(time, pitch){
// 	synthTone.triggerAttackRelease(pitch, "8n", time);
// }, [["0:0", "C4"], ["0:1", "G3"], ["0:2", "C3"], ["0:3", "G3"], ["0:4", "C3"]]);

// part.start("4m");

// var part = new Tone.Part(function(time, pitch){
// 	synthTone.triggerAttackRelease(pitch, "8n", time);
// }, [["0:0", "C4"], ["0:1", "G3"], ["0:2", "C3"], ["0:3", "G2"], ["0:4", "C2"]]);

// part.start("6m");
// var patternArr = ["C3", "E3", " ", "B3"];
//cycle up and then down the array of values

//callback order: "G3", "E3", "C3", "E3", ...repeat



//NEXUSUI
var textbuttonPlay = new Nexus.TextButton('#play-tone',{
  'size': [100,50],
  'text': 'Play'
})

var textbuttonStop = new Nexus.TextButton('#stop-tone',{
  'size': [100,50],
  'text': 'Stop'
})

var textbuttonPause = new Nexus.TextButton('#pause-tone',{
  'size': [100,50],
  'text': 'Pause'
})

var initButton = new Nexus.TextButton('#set',{
  'size': [100,50],
  'text': 'Set'
})
 /* SEQUENCER */

// var sequencer = new Nexus.Sequencer('#seq');

var sequencer = new Nexus.Sequencer('#seq',{
  'size': [500,500],
  'mode': 'toggle',
  'rows': 8,
  'columns': 8
 })
 sequencer.colorize("fill","#d1d3d6")

 var drumSequencer = new Nexus.Sequencer('#drumSeq',{
  'size': [1000, 300],
  'mode': 'toggle',
  'rows': 5,
  'columns': 16
 })
 drumSequencer.colorize("fill","#d1d3d6")

 var drumSequencerTimer = new Nexus.Sequencer('#drumSeqTimer',{
  'size': [1000, 20],
  'mode': 'toggle',
  'rows': 1,
  'columns': 16
 })
 drumSequencerTimer.colorize("fill","#d1d3d6")
 drumSequencerTimer.matrix.toggle.cell(0,0)

 drumSequencerTimer.matrix.toggle.cell(4,0)
 drumSequencerTimer.matrix.toggle.cell(8,0)
 drumSequencerTimer.matrix.toggle.cell(12,0)
//const scale = ["C4", "B3", "A3", "G3", "F3",  "A3", "A#3", "B3", "C4"]
var vol = new Tone.Volume(-30);
const verb = new Tone.Freeverb(0.25)
const seqDelay = new Tone.FeedbackDelay(0.1,0.5)
var filter = new Tone.Filter(5000, "lowpass");
//let synthPreset = Tone.FMSynth
let octave = 3;
let octNote = octave + 1;
var synthTone = new Tone.PolySynth(8, Tone.FMSynth)
seqDelay.wet.value = 0.03
//CONTROLS

let controls = new Nexus.Rack("#synthRack")

controls.colorize("fill","#d1d3d6")
let volumeSlider = new Nexus.Slider("#volume", {
  'min': -60,
  'max': 5,
  'step': 1,
  'value': -15
})

controls.freq.min = 0;
controls.freq.max = 10000;
controls.freq.value = 5000
controls.freq.on('change',function(value) {
  filter.frequency.value = value;
})
controls.reverb.value = 0.25
controls.reverb.min = 0;
controls.reverb.max = 0.9;
controls.reverb.on('change',function(value) {
	verb.roomSize.value = value;
})
controls.delay.value = 0.03
controls.delay.min = 0;
controls.delay.max = 0.9;
controls.delay.on('change',function(value) {
  seqDelay.wet.value = value;
  console.log('value', value)
})
volumeSlider.colorize("fill","#d1d3d6")
volumeSlider.on('change', function(v){
  vol.volume.rampTo(volumeSlider.value)
})

var select = new Nexus.Select('#presets',{
  'size': [100,30],
  'options': ['FMSynth','DuoSynth', 'BluSynth', 'MonoSynth', 'AMSynth']
})
select.colorize("fill","#d1d3d6")
select.on('change',function(v) {
  if (select.value === 'DuoSynth') synthTone = new Tone.PolySynth(8, Tone.DuoSynth)
  else if (select.value === 'FMSynth') synthTone = new Tone.PolySynth(8, Tone.FMSynth)
  else if (select.value === 'BluSynth') {
    synthTone = new Tone.PolySynth(8, Tone.Synth)
  }
  else if (select.value === 'MonoSynth') {
    synthTone = new Tone.PolySynth(8, Tone.MonoSynth)
  }
  else if (select.value === 'AMSynth') synthTone = new Tone.PolySynth(8, Tone.AMSynth)
})

var bpm = new Nexus.Slider('#bpm', {
  'min': 50,
  'max': 300,
  'step': 1,
  'value': 140
})

bpm.on('change', function(v){
  Tone.Transport.bpm.value = bpm.value
})
bpm.colorize("fill","#d1d3d6")
var number = new Nexus.Number('#number')

number.link(bpm)
number.colorize("fill","#d1d3d6")

var oct = new Nexus.Slider('#oct', {
  'min': 0,
  'max': 7,
  'step': 1,
  'value': 3
})

oct.on('change', function(v){
  octave = oct.value
  octNote = oct.value + 1
})
oct.colorize("fill","#d1d3d6")
var numOct = new Nexus.Number('#numOct')

numOct.link(oct)
numOct.colorize("fill","#d1d3d6")
const initSeq = function(v){

  let hatSound = DRUMS.get("hat")
  var hatPattern = drumSequencer.matrix.pattern[0].map(function(index) {
    return index ? "C" : " ";
  })
 var hat = new Tone.Sequence(function(time, pitch) {
    if(pitch !== " ") {
      hatSound.start()
    }
  }, hatPattern, "8n");
  let softhatSound = SOFTHAT.get("hat")
  var softhatPattern = drumSequencer.matrix.pattern[1].map(function(index) {
    return index ? "C" : " ";
  })
 var softhat = new Tone.Sequence(function(time, pitch) {
    if(pitch !== " ") {
      softhatSound.start()
    }
  }, softhatPattern, "8n");

  let softsnareSound = SOFTHAT.get("snare")
  var softsnarePattern = drumSequencer.matrix.pattern[2].map(function(index) {
    return index ? "C" : " ";
  })
 var softsnare = new Tone.Sequence(function(time, pitch) {
    if(pitch !== " ") {
      softsnareSound.start()
    }
  }, softsnarePattern, "8n");

  var snarePattern = drumSequencer.matrix.pattern[3].map(function(index) {
    return index ? "C" : " ";
  })
 var snare = new Tone.Sequence(function(time, pitch) {
    if(pitch !== " ") {
      DRUMS.get("snare").start()
    }
  }, snarePattern, "8n");

  var kickPattern = drumSequencer.matrix.pattern[4].map(function(index) {
    return index ? "C" : " ";
  })
 var kick = new Tone.Sequence(function(time, pitch) {
    if(pitch !== " ") {
      DRUMS.get("kick").start()
    }
  }, kickPattern, "8n");

    var rootPattern = sequencer.matrix.pattern[7].map(function(index) {
    return index ? "C"+octave+"" : " ";
  })

 arp = new Tone.Sequence(function(time, pitch) {
    if(pitch !== " ") {
    synthTone.triggerAttackRelease(pitch, "4n", time);
    }
  }, rootPattern);

  synthTone.chain( vol, filter, verb, seqDelay, Tone.Master)



    var Maj2Pattern = sequencer.matrix.pattern[6].map(function(index) {
    return index ? "D"+octave+"" : " ";
  })
  var arpMaj2 = new Tone.Sequence(function(time, pitch) {
    if(pitch !== " ") {
    synthTone.triggerAttackRelease(pitch, "4n", time);
    }
  }, Maj2Pattern);


  var maj3Pattern = sequencer.matrix.pattern[5].map(function(index) {
    return index ? "E"+octave+"" : " ";
  })
  var arpMaj3 = new Tone.Sequence(function(time, pitch) {
    if(pitch !== " ") {
    synthTone.triggerAttackRelease(pitch, "4n", time);
    }
  }, maj3Pattern);




  var p4Pattern = sequencer.matrix.pattern[4].map(function(index) {
    return index ? "F"+octave+"" : " ";
  })
  var arpp4 = new Tone.Sequence(function(time, pitch) {
    if(pitch !== " ") {
    synthTone.triggerAttackRelease(pitch, "4n", time);
    }
  }, p4Pattern);

  var p5Pattern = sequencer.matrix.pattern[3].map(function(index) {
    return index ? "G"+octave+"" : " ";
  })
  var arpp5 = new Tone.Sequence(function(time, pitch) {
    if(pitch !== " ") {
    synthTone.triggerAttackRelease(pitch, "4n", time);
    }
  }, p5Pattern);


  var maj6Pattern = sequencer.matrix.pattern[2].map(function(index) {
    return index ? "A"+octave+"" : " ";
  })
  var arpmaj6 = new Tone.Sequence(function(time, pitch) {
    if(pitch !== " ") {
    synthTone.triggerAttackRelease(pitch, "4n", time);
    }
  }, maj6Pattern);


  var maj7Pattern = sequencer.matrix.pattern[1].map(function(index) {
    return index ? "B"+octave+"" : " ";
  })
  var arpmaj7 = new Tone.Sequence(function(time, pitch) {
    if(pitch !== " ") {
    synthTone.triggerAttackRelease(pitch, "4n", time);
    }
  }, maj7Pattern);

  var octPattern = sequencer.matrix.pattern[0].map(function(index) {
    return index ? "C"+octNote+"" : " ";
  })
  var arpoct = new Tone.Sequence(function(time, pitch) {
    if(pitch !== " ") {
    synthTone.triggerAttackRelease(pitch, "4n", time);
    }
  }, octPattern);

textbuttonPlay.on('change',function(v) {

  //drumSequencerTimer.matrix.toggle.cell(0,0)
Tone.Transport.start();
  hat.start();
  softhat.start();

  softsnare.start();
  snare.start();
  kick.start();
  arp.start();
  arpMaj2.start();
  arpMaj3.start();
  arpMaj3.start();
  arpp4.start();
  arpp5.start();
  arpmaj6.start();
  arpmaj7.start();
  arpoct.start()
})

textbuttonStop.on('change',function(v) {

  hat.stop();
  softhat.stop();
  softsnare.stop();
  snare.stop();
  kick.stop();
  arp.stop();
  arpMaj2.stop();
  arpMaj3.stop();
  arpMaj3.stop();
  arpp4.stop();
  arpp5.stop();
  arpmaj6.stop();
  arpmaj7.stop();
  arpoct.stop()
  Tone.Transport.stop()
  softhat.removeAll();
  softsnare.removeAll();
  hat.removeAll();
  snare.removeAll();
  kick.removeAll();
  arp.removeAll();
  arpMaj2.removeAll();
  arpMaj3.removeAll();
  arpp4.removeAll();
  arpp5.removeAll();
  arpmaj6.removeAll();
  arpmaj7.removeAll();
  arpoct.removeAll();
  })
}
textbuttonPause.on('change',function(v) {
      Tone.Transport.pause();
    })

initButton.on('change', function(v) {
          initSeq();
})

textbuttonPause.colorize("fill","#2bb")
textbuttonPlay.colorize("fill","#2bb")
textbuttonStop.colorize("fill","#2bb")
initButton.colorize("fill","#2bb")


 /* SLIDERS */
// Create interfaces
var power = new Nexus.Toggle("#power");
power.colorize("fill","#d1d3d6")
// Create a sound source using Tone.js
var synth = new Tone.Oscillator(0,"sine")
// var volume = new Tone.Volume(-Infinity);
// var delayGen = new Tone.FeedbackDelay(0.2,0.7);
// synth.chain( delayGen, volume, Tone.Master );

// // Customize interface &
// // Add event listeners
// delay.min = 0;
// delay.max = 0.7;
// delay.on('change',function(value) {
// 	delayGen.wet.value = value;
// })
// delay.value = 0.4;

power.on('change',function(v) {
	// volume.volume.cancelScheduledValues();
	// var level = v ? -20 : -Infinity;
  // volume.volume.rampTo(level,3)

  //try to connect
  var dest = synth._context.createMediaStreamDestination();
  Tone.Master.connect(dest);
  visualize(dest.stream);
  onSuccess(dest.stream);

  //disable other recording modes
  synthMode = false;
  console.log("Nexus Mode!");
  enableMic.style.background = "";
  enableSynth.style.background = "";
  enableSynth.disabled = false;
  enableMic.disabled = false;
})


//DRUM MACHINE

var DRUMS = new Tone.Players({
  "hat" : "../CR78/hihat.[aif|wav]",
  "snare" : "../CR78/snare.[aif|wav]",
  "kick" : "../CR78/kick.[aif|wav]"
}, {
  "volume" : -10
}).toMaster();

var SOFTHAT =  new Tone.Players({

    "hat" : "../CR78/hihat.[aif|wav]",

    "snare" : "../CR78/snare.[aif|wav]"},{
      "volume" : 10
    }
    ).chain( vol, filter, verb, seqDelay, Tone.Master);


  //   var div = document.querySelector("#download");

  //   function handleFilesSelect(input) {
  //     div.innerHTML = "loading audio tracks.. please wait";
  //     var files = input
  //     var duration = 60000;
  //     var chunks = [];
  //     var audio = new AudioContext();
  //     var mixedAudio = audio.createMediaStreamDestination();
  //     var player = new Audio();
  //     var context;
  //     var recorder;
  //     var description = "";

  //     player.controls = "controls";

  //     function get(file) {
  //       return new Promise(function(resolve, reject) {
  //         var reader = new FileReader;
  //         reader.readAsArrayBuffer(file);
  //         reader.onload = function() {
  //           resolve(reader.result)
  //         }
  //       })
  //     }

  //     function stopMix(duration, ...media) {
  //       setTimeout(function(media) {
  //         media.forEach(function(node) {
  //           node.stop()
  //         })
  //       }, duration, media)
  //     }

  //     Promise.all(files.map(get)).then(function(data) {
  //         var len = Math.max.apply(Math, data.map(function(buffer) {
  //           return buffer.byteLength
  //         }));
  //         context = new OfflineAudioContext(2, len, 44100);
  //         return Promise.all(data.map(function(buffer) {
  //             return audio.decodeAudioData(buffer)
  //               .then(function(bufferSource) {
  //                 var source = context.createBufferSource();
  //                 source.buffer = bufferSource;
  //                 source.connect(context.destination);
  //                 return source.start()
  //               })
  //           }))
  //           .then(function() {
  //             return context.startRendering()
  //           })
  //           .then(function(renderedBuffer) {
  //             return new Promise(function(resolve) {
  //               var mix = audio.createBufferSource();
  //               mix.buffer = renderedBuffer;
  //               mix.connect(audio.destination);
  //               mix.connect(mixedAudio);
  //               recorder = new MediaRecorder(mixedAudio.stream);
  //               recorder.start(0);
  //               mix.start(0);
  //               div.innerHTML = "playing and recording tracks..";
  //               // stop playback and recorder in 60 seconds
  //               stopMix(duration, mix, recorder)

  //               recorder.ondataavailable = function(event) {
  //                 chunks.push(event.data);
  //               };

  //               recorder.onstop = function(event) {
  //                 var blob = new Blob(chunks, {
  //                   "type": "audio/ogg; codecs=opus"
  //                 });
  //                 console.log("recording complete");
  //                 resolve(blob)
  //               };
  //             })
  //           })
  //           .then(function(blob) {
  //             console.log(blob);
  //             div.innerHTML = "mixed audio tracks ready for download..";
  //             var audioDownload = URL.createObjectURL(blob);
  //             var a = document.createElement("a");
  //             a.download = description + "." + blob.type.replace(/.+\/|;.+/g, "");
  //             a.href = audioDownload;
  //             a.innerHTML = a.download;
  //             document.body.appendChild(a);
  //             a.insertAdjacentHTML("afterend", "<br>");
  //             player.src = audioDownload;
  //             document.body.appendChild(player);
  //           })
  //       })
  //       .catch(function(e) {
  //         console.log(e)
  //       });

  //   }

  // let  downloadBtn = document.querySelector("#downloadBtn")

  // downloadBtn.onclick = function() {
  //   handleFilesSelect(blobArr);
  // }

