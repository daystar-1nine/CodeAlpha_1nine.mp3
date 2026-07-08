export class StorageEngine {
  constructor(dbName = '1nine_db', version = 2) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Store track metadata. The actual File handles are stored here too.
        if (!db.objectStoreNames.contains('tracks')) {
          const trackStore = db.createObjectStore('tracks', { keyPath: 'id' });
          trackStore.createIndex('album', 'album', { unique: false });
          trackStore.createIndex('artist', 'artist', { unique: false });
        }
        
        // Store global settings and root directory handle
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Store custom playlists
        if (!db.objectStoreNames.contains('playlists')) {
          db.createObjectStore('playlists', { keyPath: 'id' });
        }
      };
    });
  }

  async saveSetting(key, value) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async getSetting(key) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);
      request.onsuccess = (e) => resolve(e.target.result ? e.target.result.value : null);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async saveTrack(track) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      // Clean track object before storing to prevent DataCloneError
      const cleanTrack = { ...track };
      // Native FileSystemFileHandle does not have its prototype methods enumerable as own properties.
      // We check for 'getFile' as an own property to detect our mock handle.
      if (cleanTrack.handle && Object.prototype.hasOwnProperty.call(cleanTrack.handle, 'getFile')) {
         // It's a mock handle. We cannot persist it across reloads.
         delete cleanTrack.handle; 
      }
      
      const transaction = this.db.transaction(['tracks'], 'readwrite');
      const store = transaction.objectStore('tracks');
      
      // Keep existing playcount if overwriting an existing track
      const getReq = store.get(cleanTrack.id);
      getReq.onsuccess = (e) => {
        const existing = e.target.result;
        if (existing) {
          cleanTrack.playCount = existing.playCount || 0;
          cleanTrack.lastPlayed = existing.lastPlayed || null;
        } else {
          cleanTrack.playCount = 0;
          cleanTrack.lastPlayed = null;
        }
        const putReq = store.put(cleanTrack);
        putReq.onsuccess = () => resolve();
        putReq.onerror = (e) => reject(e.target.error);
      };
      getReq.onerror = (e) => reject(e.target.error);
    });
  }

  async getAllTracks() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['tracks'], 'readonly');
      const store = transaction.objectStore('tracks');
      const request = store.getAll();
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async clearTracks() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['tracks'], 'readwrite');
      const store = transaction.objectStore('tracks');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async incrementPlayCount(trackId) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['tracks'], 'readwrite');
      const store = transaction.objectStore('tracks');
      const request = store.get(trackId);
      request.onsuccess = (e) => {
        const track = e.target.result;
        if (track) {
          track.playCount = (track.playCount || 0) + 1;
          track.lastPlayed = Date.now();
          store.put(track);
        }
        resolve();
      };
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // Playlists API
  async savePlaylist(playlist) { // { id, name, trackIds: [] }
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['playlists'], 'readwrite');
      const store = transaction.objectStore('playlists');
      const request = store.put(playlist);
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async getAllPlaylists() {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['playlists'], 'readonly');
      const store = transaction.objectStore('playlists');
      const request = store.getAll();
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async deletePlaylist(id) {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['playlists'], 'readwrite');
      const store = transaction.objectStore('playlists');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  }
}

export const storage = new StorageEngine();
