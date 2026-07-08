export class MetadataManager {
  /**
   * Extracts metadata from a File object
   * @param {File} file 
   * @returns {Promise<Object>}
   */
  async extractMetadata(file) {
    return new Promise((resolve, reject) => {
      if (!window.jsmediatags) {
        console.error("jsmediatags is not loaded");
        resolve({ title: file.name.replace(/\.[^/.]+$/, ""), artist: 'Unknown Artist', album: 'Unknown', year: '', genre: '', coverUrl: null });
        return;
      }
      window.jsmediatags.read(file, {
        onSuccess: (tag) => {
          const tags = tag.tags;
          
          let coverUrl = null;
          if (tags.picture) {
            const { data, format } = tags.picture;
            let base64String = "";
            for (let i = 0; i < data.length; i++) {
              base64String += String.fromCharCode(data[i]);
            }
            coverUrl = `data:${format};base64,${window.btoa(base64String)}`;
          }

          const extension = file.name.split('.').pop().toUpperCase();
          const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
          
          resolve({
            title: tags.title || file.name.replace(/\.[^/.]+$/, ""),
            artist: tags.artist || 'Unknown Artist',
            album: tags.album || 'Unknown Album',
            year: tags.year || '',
            genre: tags.genre || '',
            coverUrl: coverUrl || this.generateFallbackArtwork(tags.artist || 'Unknown', tags.title || file.name),
            duration: 0, // Duration usually requires AudioContext to decode
            format: extension,
            size: sizeMB,
            bitrate: 'Unknown' // Browser doesn't extract this easily without a heavy library
          });
        },
        onError: (error) => {
          console.warn(`Failed to read metadata for ${file.name}`, error);
          const extension = file.name.split('.').pop().toUpperCase();
          const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
          
          resolve({
            title: file.name.replace(/\.[^/.]+$/, ""),
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            year: '',
            genre: '',
            coverUrl: this.generateFallbackArtwork('Unknown', file.name),
            duration: 0,
            format: extension,
            size: sizeMB,
            bitrate: 'Unknown'
          });
        }
      });
    });
  }

  generateFallbackArtwork(artist, title) {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    // Create a beautiful premium gradient based on strings
    const hashStr = artist + title;
    let hash = 0;
    for (let i = 0; i < hashStr.length; i++) {
      hash = hashStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color1 = `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
    const color2 = `hsl(${(Math.abs(hash) + 60) % 360}, 70%, 30%)`;
    const color3 = `hsl(${(Math.abs(hash) + 120) % 360}, 80%, 20%)`;
    
    const grad = ctx.createLinearGradient(0, 0, 400, 400);
    grad.addColorStop(0, color1);
    grad.addColorStop(0.5, color2);
    grad.addColorStop(1, color3);
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 400, 400);
    
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 120px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const initial = artist !== 'Unknown Artist' && artist !== 'Unknown' 
      ? artist.charAt(0).toUpperCase() 
      : title.charAt(0).toUpperCase();
      
    ctx.fillText(initial, 200, 200);
    
    return canvas.toDataURL('image/jpeg', 0.8);
  }

  /**
   * Processes a FileSystemFileHandle, gets the File object, extracts metadata, 
   * and returns a standardized Track object ready for StorageEngine.
   */
  async processFileHandle(fileHandle) {
    const file = await fileHandle.getFile();
    const metadata = await this.extractMetadata(file);
    
    return {
      id: fileHandle.name + '-' + file.lastModified, // simple unique ID
      name: file.name,
      handle: fileHandle, // Store the handle to re-access the file later
      ...metadata
    };
  }
}

export const metadataManager = new MetadataManager();
