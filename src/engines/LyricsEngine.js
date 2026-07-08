export class LyricsEngine {
  constructor() {
    this.lyrics = [];
    this.currentIndex = -1;
    this.onLyricChangeCallback = null;
    this.isLoading = false;
  }

  /**
   * Fetches synchronized lyrics from LRCLIB.
   */
  async fetchLyrics(title, artist, album = '') {
    this.lyrics = [];
    this.currentIndex = -1;
    this.isLoading = true;
    
    try {
      const url = new URL('https://lrclib.net/api/get');
      url.searchParams.append('track_name', title);
      url.searchParams.append('artist_name', artist);
      if (album) url.searchParams.append('album_name', album);
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Lyrics not found');
      
      const data = await response.json();
      if (data.syncedLyrics) {
        this._parseLRC(data.syncedLyrics);
      } else if (data.plainLyrics) {
        // Fallback for non-synced lyrics
        this.lyrics = data.plainLyrics.split('\n').map(line => ({ time: 0, text: line }));
      }
    } catch (e) {
      console.warn("Could not fetch lyrics", e);
      this.lyrics = [{ time: 0, text: "Lyrics not available." }];
    } finally {
      this.isLoading = false;
    }
  }

  _parseLRC(lrcText) {
    const lines = lrcText.split('\n');
    const timeRegEx = /\[(\d+):(\d+\.\d+)\]/;
    
    this.lyrics = [];
    
    lines.forEach(line => {
      const match = line.match(timeRegEx);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseFloat(match[2]);
        const time = (minutes * 60) + seconds;
        const text = line.replace(timeRegEx, '').trim();
        if (text) {
          this.lyrics.push({ time, text });
        }
      }
    });
  }

  updateTime(currentTime) {
    if (this.lyrics.length === 0) return;
    
    let activeIndex = -1;
    for (let i = 0; i < this.lyrics.length; i++) {
      if (currentTime >= this.lyrics[i].time) {
        activeIndex = i;
      } else {
        break;
      }
    }

    if (activeIndex !== this.currentIndex && activeIndex !== -1) {
      this.currentIndex = activeIndex;
      if (this.onLyricChangeCallback) {
        this.onLyricChangeCallback(this.currentIndex, this.lyrics[this.currentIndex].text);
      }
    }
  }
}

export const lyricsEngine = new LyricsEngine();
