export class AudioEngine {
  constructor() {
    // Primary audio element
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = "anonymous";
    this.audioElement.preservesPitch = true;
    
    // Secondary audio element (for crossfading)
    this.audioElementB = new Audio();
    this.audioElementB.crossOrigin = "anonymous";
    this.audioElementB.preservesPitch = true;

    this.audioContext = null;
    this.sourceNode = null;
    this.sourceNodeB = null;
    
    this.primaryGain = null;
    this.secondaryGain = null;
    this.masterGain = null;
    this.analyserNode = null;
    
    // EQ and Effects
    this.eqBands = [];
    this.eqFrequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    this.reverbNode = null;
    
    this.currentObjectUrl = null;
    
    // Crossfade state
    this.isCrossfading = false;
    this.crossfadeDuration = 0; // seconds, 0 = disabled by default
    this.activeElement = 'A'; // 'A' or 'B'
    
    this._bindEvents(this.audioElement, 'A');
    this._bindEvents(this.audioElementB, 'B');

    this.onEndedCallback = null;
    this.onTimeUpdateCallback = null;
    this.onPlayStateCallback = null;
    
    this.currentPreset = 'flat';
    this.eqPresets = {
      flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      bassBoost: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
      electronic: [5, 4, 2, 0, -2, -2, 0, 2, 4, 5],
      acoustic: [2, 2, 1, 0, 0, 0, 2, 2, 3, 2],
      vocal: [-2, -2, -1, 1, 4, 4, 3, 1, -1, -2],
      rock: [4, 3, 2, 0, -1, -1, 0, 2, 3, 4],
      pop: [2, 3, 4, 2, -1, -2, -1, 2, 4, 3]
    };
  }

  _bindEvents(element, id) {
    element.addEventListener('ended', () => {
      // If we are crossfading, 'ended' will be handled manually via timeout or early trigger
      if (this.activeElement === id && !this.isCrossfading && this.crossfadeDuration === 0) {
        this.onEnded();
      }
    });
    element.addEventListener('timeupdate', () => {
      // Initiate crossfade if near end
      if (this.activeElement === id && !this.isCrossfading && this.crossfadeDuration > 0) {
        if (element.duration && element.duration - element.currentTime <= this.crossfadeDuration) {
           this.isCrossfading = true; // Lock so we don't trigger multiple times
           this.onEnded(); // Trigger next track early for crossfade
        }
      }
      if (this.activeElement === id) this.onTimeUpdate();
    });
    element.addEventListener('play', () => {
      if (this.activeElement === id) this.onPlayStateChange(true);
    });
    element.addEventListener('pause', () => {
      if (this.activeElement === id && !this.isCrossfading) this.onPlayStateChange(false);
    });
  }

  initAudioContext() {
    if (!this.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;

      this.masterGain = this.audioContext.createGain();
      this.primaryGain = this.audioContext.createGain();
      this.secondaryGain = this.audioContext.createGain();
      
      this.primaryGain.gain.value = 1;
      this.secondaryGain.gain.value = 0; // muted initially

      this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
      this.sourceNodeB = this.audioContext.createMediaElementSource(this.audioElementB);

      // Create EQ Bands
      let lastNode = null;
      this.eqFrequencies.forEach((freq, i) => {
        const filter = this.audioContext.createBiquadFilter();
        if (i === 0) filter.type = 'lowshelf';
        else if (i === this.eqFrequencies.length - 1) filter.type = 'highshelf';
        else filter.type = 'peaking';
        
        filter.frequency.value = freq;
        filter.gain.value = 0;
        this.eqBands.push(filter);
        
        if (lastNode) lastNode.connect(filter);
        lastNode = filter;
      });

      // Reverb Node
      this.reverbNode = this.audioContext.createConvolver();
      this.dryGain = this.audioContext.createGain();
      this.wetGain = this.audioContext.createGain();
      this.wetGain.gain.value = 0; // Reverb off
      
      // Routing
      this.sourceNode.connect(this.primaryGain);
      this.sourceNodeB.connect(this.secondaryGain);
      
      this.primaryGain.connect(this.eqBands[0]);
      this.secondaryGain.connect(this.eqBands[0]);
      
      lastNode.connect(this.dryGain);
      lastNode.connect(this.reverbNode);
      this.reverbNode.connect(this.wetGain);
      
      this.dryGain.connect(this.masterGain);
      this.wetGain.connect(this.masterGain);
      
      this.masterGain.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);
      
      this._generateImpulseResponse();
    }
    
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  _generateImpulseResponse() {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * 2.5; 
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
      const n = length - i;
      left[i] = (Math.random() * 2 - 1) * Math.pow(n / length, 3);
      right[i] = (Math.random() * 2 - 1) * Math.pow(n / length, 3);
    }
    this.reverbNode.buffer = impulse;
  }

  setEQPreset(presetName) {
    if (this.eqPresets[presetName]) {
      this.currentPreset = presetName;
      const values = this.eqPresets[presetName];
      this.eqBands.forEach((band, i) => {
        if (this.audioContext) {
          band.gain.setTargetAtTime(values[i], this.audioContext.currentTime, 0.1);
        } else {
          band.gain.value = values[i];
        }
      });
    }
  }

  setEQBand(index, value) {
    if (this.eqBands[index]) {
      this.currentPreset = 'custom';
      if (this.audioContext) {
        this.eqBands[index].gain.setTargetAtTime(value, this.audioContext.currentTime, 0.1);
      } else {
        this.eqBands[index].gain.value = value;
      }
    }
  }

  setReverbLevel(level) { 
    if (this.audioContext) {
      this.wetGain.gain.setTargetAtTime(level, this.audioContext.currentTime, 0.1);
      this.dryGain.gain.setTargetAtTime(1 - (level * 0.5), this.audioContext.currentTime, 0.1);
    }
  }

  setSpeed(speed, preservePitch = true) {
    this.audioElement.playbackRate = speed;
    this.audioElement.preservesPitch = preservePitch;
    this.audioElementB.playbackRate = speed;
    this.audioElementB.preservesPitch = preservePitch;
  }

  setCrossfade(seconds) {
    this.crossfadeDuration = seconds;
  }

  async loadAndPlay(file) {
    this.initAudioContext();
    const newUrl = URL.createObjectURL(file);
    
    // Crossfading Logic
    if (this.crossfadeDuration > 0 && !this.getActiveElement().paused && this.getActiveElement().src) {
      if (this.activeElement === 'A') {
        this.audioElementB.src = newUrl;
        this.audioElementB.load();
        await this.audioElementB.play();
        
        this.primaryGain.gain.setValueAtTime(this.primaryGain.gain.value, this.audioContext.currentTime);
        this.primaryGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + this.crossfadeDuration);
        
        this.secondaryGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.secondaryGain.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + this.crossfadeDuration);
        
        this.activeElement = 'B';
        setTimeout(() => {
          this.audioElement.pause();
          this.isCrossfading = false;
        }, this.crossfadeDuration * 1000);
      } else {
        this.audioElement.src = newUrl;
        this.audioElement.load();
        await this.audioElement.play();
        
        this.secondaryGain.gain.setValueAtTime(this.secondaryGain.gain.value, this.audioContext.currentTime);
        this.secondaryGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + this.crossfadeDuration);
        
        this.primaryGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.primaryGain.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + this.crossfadeDuration);
        
        this.activeElement = 'A';
        setTimeout(() => {
          this.audioElementB.pause();
          this.isCrossfading = false;
        }, this.crossfadeDuration * 1000);
      }
    } else {
      // Hard cut / normal play
      this.isCrossfading = false;
      const targetElement = this.activeElement === 'A' ? this.audioElement : this.audioElementB;
      const targetGain = this.activeElement === 'A' ? this.primaryGain : this.secondaryGain;
      const otherGain = this.activeElement === 'A' ? this.secondaryGain : this.primaryGain;
      
      targetElement.src = newUrl;
      targetElement.load();
      if (this.audioContext) {
        targetGain.gain.setValueAtTime(1, this.audioContext.currentTime);
        otherGain.gain.setValueAtTime(0, this.audioContext.currentTime);
      }
      
      return targetElement.play();
    }
  }

  getActiveElement() {
    return this.activeElement === 'A' ? this.audioElement : this.audioElementB;
  }

  play() {
    this.initAudioContext();
    return this.getActiveElement().play();
  }

  pause() {
    this.getActiveElement().pause();
  }

  togglePlay() {
    const el = this.getActiveElement();
    if (el.paused) {
      this.play();
    } else {
      this.pause();
    }
  }

  seek(time) {
    this.getActiveElement().currentTime = time;
  }
  
  setVolume(vol) {
    if (this.masterGain && this.audioContext) {
      this.masterGain.gain.setTargetAtTime(vol, this.audioContext.currentTime, 0.1);
    } else {
      this.audioElement.volume = vol;
      this.audioElementB.volume = vol;
    }
  }

  // Event handlers
  onEnded() {
    if (this.onEndedCallback) this.onEndedCallback();
  }

  onTimeUpdate() {
    if (this.onTimeUpdateCallback) {
      const el = this.getActiveElement();
      this.onTimeUpdateCallback(el.currentTime, el.duration);
    }
  }

  onPlayStateChange(isPlaying) {
    if (this.onPlayStateCallback) {
      this.onPlayStateCallback(isPlaying);
    }
  }

  // Visualizer hook
  getAnalyserData(arrayType = 'frequency') {
    if (!this.analyserNode) return null;
    if (arrayType === 'frequency') {
      if (!this._frequencyDataArray) {
        this._frequencyDataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
      }
      this.analyserNode.getByteFrequencyData(this._frequencyDataArray);
      return this._frequencyDataArray;
    } else {
      if (!this._timeDomainDataArray) {
        this._timeDomainDataArray = new Uint8Array(this.analyserNode.frequencyBinCount);
      }
      this.analyserNode.getByteTimeDomainData(this._timeDomainDataArray);
      return this._timeDomainDataArray;
    }
  }
}

export const audioEngine = new AudioEngine();
