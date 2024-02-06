



document.addEventListener("DOMContentLoaded", function(event) {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const globalGain = audioCtx.createGain(); //this will control the volume of all notes

    globalGain.connect(audioCtx.destination);
    var oscList = []
    var asGain = audioCtx.createGain();
    asGain.gain.setValueAtTime(0, audioCtx.currentTime);
    asGain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.001);

    function initAS(numOscillators) {
        asGain = audioCtx.createGain();
        asGain.gain.setValueAtTime(0, audioCtx.currentTime);
        asGain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.001);
        asGain.connect(globalGain);

        var waveform = document.querySelector('input[name="waveform"]:checked').value;
        for (let i = 0; i< numOscillators; i++){
            var osc = audioCtx.createOscillator();
            osc.type = waveform;
            osc.frequency.value = (i + 1) * 440 + Math.random() * 15;
            oscList.push(osc);
            osc.connect(asGain);
        }
        var addLFO = document.querySelector('input[name="lfoAS"]').checked;
        if(addLFO){
            var lfo = audioCtx.createOscillator();
            lfo.frequency.value = 2;
            lfoGain = audioCtx.createGain();
            lfoGain.gain.value = 100;
            lfo.connect(lfoGain).connect(oscList[0].frequency);
            lfo.start();
        }
 
        for (let x in oscList){
            oscList[x].start();
        }

    
    }
    
    
    const playButton = document.querySelector('button');
    var asRunning = false;
    playButton.addEventListener('click', function() {
        var numOscVal = document.querySelector('input[name="numOsc');
        var lfoASCheckbox = document.querySelector('input[name="lfoAS');
        if(oscList.length == 0) {
            var numOsc = document.querySelector('input[name="numOsc"]').value;
            initAS(numOsc);
        }
    
        if (!asRunning) {
            asGain.gain.setValueAtTime(0, audioCtx.currentTime);
            asGain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.005);
            numOscVal.disabled=true;
            lfoASCheckbox.disabled = true;
        }
    
        if (asRunning) {
            var releaseTime = audioCtx.currentTime + 0.3;
            asGain.gain.setTargetAtTime(0, releaseTime - 0.25, .1);
            for (let x in oscList){
                oscList[x].stop(releaseTime);
            }
            oscList = [];
            numOscVal.disabled=false;
            lfoASCheckbox.disabled = false;
        }
        asRunning = !asRunning;
    
    }, false);


    const keyboardFrequencyMap = {
        '90': 261.625565300598634,  //Z - C
        '83': 277.182630976872096, //S - C#
        '88': 293.664767917407560,  //X - D
        '68': 311.126983722080910, //D - D#
        '67': 329.627556912869929,  //C - E
        '86': 349.228231433003884,  //V - F
        '71': 369.994422711634398, //G - F#
        '66': 391.995435981749294,  //B - G
        '72': 415.304697579945138, //H - G#
        '78': 440.000000000000000,  //N - A
        '74': 466.163761518089916, //J - A#
        '77': 493.883301256124111,  //M - B
        '81': 523.251130601197269,  //Q - C
        '50': 554.365261953744192, //2 - C#
        '87': 587.329535834815120,  //W - D
        '51': 622.253967444161821, //3 - D#
        '69': 659.255113825739859,  //E - E
        '82': 698.456462866007768,  //R - F
        '53': 739.988845423268797, //5 - F#
        '84': 783.990871963498588,  //T - G
        '54': 830.609395159890277, //6 - G#
        '89': 880.000000000000000,  //Y - A
        '55': 932.327523036179832, //7 - A#
        '85': 987.766602512248223,  //U - B
    }

    window.addEventListener('keydown', keyDown, false);
    window.addEventListener('keyup', keyUp, false);
    gainNodes = {}
    activeOscillators = {}
 
    var numNotes = 0;
    
    function keyDown(event) {

        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && !activeOscillators[key]) {
            var numModulators = 0;
            if (document.querySelector('input[name="AM"]').checked){
                numModulators ++;
            }
            if (document.querySelector('input[name="FM"]').checked){
                numModulators ++;
            }
            if (asRunning){
                numModulators ++;
            }
            numNotes ++;
            globalGain.gain.setTargetAtTime(0.3/(numNotes + numModulators), audioCtx.currentTime, .1);
            playNote(key);
        }
    }

    function keyUp(event) {

        const key = (event.detail || event.which).toString();
        if (keyboardFrequencyMap[key] && activeOscillators[key]) {
            
            var releaseTime = audioCtx.currentTime + 0.3;
            gainNodes[key].gain.setTargetAtTime(0, releaseTime - 0.25, .1);
            activeOscillators[key].stop(releaseTime);
            delete gainNodes[key];
            delete activeOscillators[key];

            numNotes --;
        }
    }

    var amModFreqInput = document.querySelector('input[name="amModFreq"]');
    var amModFreq;
    amModFreqInput.addEventListener('input', () => {
        amModFreq = amModFreqInput.value; 
    });


    var fmModFreqInput = document.querySelector('input[name="fmModFreq"]'); 
    var fmModFreq;
    fmModFreqInput.addEventListener('input', () => {
        fmModFreq = fmModFreqInput.value; 
    });
    
    
    var fmModIdxInput = document.querySelector('input[name="fmModIdx"]'); 
    var fmModIdx;
    fmModIdxInput.addEventListener('input', () => {
        fmModIdx = fmModIdxInput.value; 
    });
    
    
    
    function playNote(key) {
        var carrier = audioCtx.createOscillator();
        carrier.frequency.value = keyboardFrequencyMap[key];
        carrier.type = document.querySelector('input[name="waveform"]:checked').value;

        activeOscillators[key] = carrier;

        const gainNode = audioCtx.createGain();
        gainNodes[key] = gainNode;
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.9, audioCtx.currentTime + 0.001);


        if (document.querySelector('input[name="AM"]').checked){
            amModFreq = audioCtx.createOscillator();
            amModFreq.frequency.value = document.querySelector('input[name="amModFreq"]').value;
            const modulated = audioCtx.createGain();
            const depth = audioCtx.createGain();
            depth.gain.value = 0.5 //scale modulator output to [-0.5, 0.5]
            modulated.gain.value = 1.0 - depth.gain.value; //a fixed value of 0.5
            
            amModFreq.connect(depth).connect(modulated.gain); //.connect is additive, so with [-0.5,0.5] and 0.5, the modulated signal now has output gain at [0,1]
            modulated.connect(gainNode).connect(globalGain);
            carrier.connect(modulated);
            var addLFO = document.querySelector('input[name="lfoAM"]').checked;
            if(addLFO){
                var lfo = audioCtx.createOscillator();
                lfo.frequency.value = 2;
                lfoGain = audioCtx.createGain();
                lfoGain.gain.value = 100;
                lfo.connect(lfoGain).connect(amModFreq.frequency);
                lfo.start();
            }
            amModFreq.start();
            
        }
        if (document.querySelector('input[name="FM"]').checked){
            fmModIdx = audioCtx.createGain();
            fmModIdx.gain.value = document.querySelector('input[name="fmModIdx"]').value;
            fmModFreq = audioCtx.createOscillator();

            fmModFreq.frequency.value = document.querySelector('input[name="fmModFreq"]').value;;

            fmModFreq.connect(fmModIdx);
            fmModIdx.connect(carrier.frequency)
            
            carrier.connect(gainNode).connect(globalGain);
            var addLFO = document.querySelector('input[name="lfoFM"]').checked;
            if(addLFO){
                var lfo = audioCtx.createOscillator();
                lfo.frequency.value = 2;
                lfoGain = audioCtx.createGain();
                lfoGain.gain.value = 100;
                lfo.connect(lfoGain).connect(fmModFreq.frequency);
                lfo.start();
            }

            fmModFreq.start();
        }

        
        carrier.start();
        


       
    }


    
    
}
)




