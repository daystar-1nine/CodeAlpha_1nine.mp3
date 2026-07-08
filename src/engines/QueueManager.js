import { audioEngine } from './AudioEngine.js';
import { themeEngine } from './ThemeEngine.js';
import { storage } from './StorageEngine.js';

export class QueueManager {
  constructor() {
    this.queue = [];
    this.currentIndex = -1;
    this.history = []; // To support going back when shuffled
    this.isShuffled = false;
    this.repeatMode = 'none'; // 'none', 'all', 'one'
    
    // Bind audio engine events
    audioEngine.onEndedCallback = () => this.handleTrackEnded();
    
    // Callbacks for UI updates
    this.onTrackChangeCallback = null;
    this.onQueueChangeCallback = null;
  }

  setQueue(tracks, startIndex = 0) {
    this.queue = [...tracks];
    this.currentIndex = startIndex;
    this.history = [];
    this.playCurrentTrack();
    if (this.onQueueChangeCallback) this.onQueueChangeCallback(this.queue);
  }

  addTrack(track) {
    this.queue.push(track);
    if (this.queue.length === 1) {
      this.currentIndex = 0;
      this.playCurrentTrack();
    }
    if (this.onQueueChangeCallback) this.onQueueChangeCallback(this.queue);
  }

  async playCurrentTrack() {
    if (this.currentIndex < 0 || this.currentIndex >= this.queue.length) return;
    
    const track = this.queue[this.currentIndex];
    
    try {
      const file = await track.handle.getFile();
      await audioEngine.loadAndPlay(file);
      
      // Increment play count asynchronously
      storage.incrementPlayCount(track.id).catch(console.warn);
      
      
      // Trigger theme extraction if in dynamic mode
      if (themeEngine.currentMode === 'dynamic') {
        if (track.coverUrl) {
          themeEngine.applyThemeFromImage(track.coverUrl);
        } else {
          themeEngine.applyDefaultTheme();
        }
      }

      if (this.onTrackChangeCallback) {
        this.onTrackChangeCallback(track);
      }
    } catch (error) {
      console.error("Failed to play track:", error);
      // Auto-skip on failure can cause infinite loops if all handles are missing
      // So we pause and notify the user instead
      import('./NotificationEngine.js').then(({ notificationEngine }) => {
        notificationEngine.show({ title: 'Playback Error', message: 'File could not be found. Please re-import.', type: 'error' });
      });
      import('./AudioEngine.js').then(({ audioEngine }) => {
        audioEngine.pause();
      });
    }
  }

  next() {
    if (this.queue.length === 0) return;
    
    this.history.push(this.currentIndex);
    
    if (this.isShuffled) {
      let nextIndex = this.currentIndex;
      while (nextIndex === this.currentIndex && this.queue.length > 1) {
        nextIndex = Math.floor(Math.random() * this.queue.length);
      }
      this.currentIndex = nextIndex;
    } else {
      this.currentIndex++;
      if (this.currentIndex >= this.queue.length) {
        if (this.repeatMode === 'all') {
          this.currentIndex = 0;
        } else {
          this.currentIndex = this.queue.length - 1; // Stay at end
          audioEngine.pause();
          return;
        }
      }
    }
    
    this.playCurrentTrack();
  }

  previous() {
    if (this.queue.length === 0) return;
    
    // If we've played more than 3 seconds, restart current track
    if (audioEngine.audioElement.currentTime > 3) {
      audioEngine.seek(0);
      return;
    }
    
    if (this.history.length > 0) {
      this.currentIndex = this.history.pop();
    } else {
      this.currentIndex--;
      if (this.currentIndex < 0) {
        this.currentIndex = this.repeatMode === 'all' ? this.queue.length - 1 : 0;
      }
    }
    
    this.playCurrentTrack();
  }

  handleTrackEnded() {
    if (this.repeatMode === 'one') {
      audioEngine.seek(0);
      audioEngine.play();
    } else {
      this.next();
    }
  }

  playTrackAtIndex(index) {
    if (index >= 0 && index < this.queue.length) {
      this.currentIndex = index;
      this.playCurrentTrack();
      if (this.onQueueChangeCallback) this.onQueueChangeCallback(this.queue);
    }
  }

  removeTrack(index) {
    if (index >= 0 && index < this.queue.length) {
      this.queue.splice(index, 1);
      if (index < this.currentIndex) {
        this.currentIndex--;
      } else if (index === this.currentIndex) {
        // If current track is removed, play next or stop
        if (this.queue.length > 0) {
          if (this.currentIndex >= this.queue.length) this.currentIndex = 0;
          this.playCurrentTrack();
        } else {
          audioEngine.pause();
          this.currentIndex = -1;
        }
      }
      if (this.onQueueChangeCallback) this.onQueueChangeCallback(this.queue);
    }
  }

  clearQueue() {
    this.queue = [];
    this.currentIndex = -1;
    this.history = [];
    audioEngine.pause();
    if (this.onQueueChangeCallback) this.onQueueChangeCallback(this.queue);
  }

  toggleShuffle() {
    this.isShuffled = !this.isShuffled;
    return this.isShuffled;
  }

  toggleRepeat() {
    if (this.repeatMode === 'none') this.repeatMode = 'all';
    else if (this.repeatMode === 'all') this.repeatMode = 'one';
    else this.repeatMode = 'none';
    return this.repeatMode;
  }
}

export const queueManager = new QueueManager();
