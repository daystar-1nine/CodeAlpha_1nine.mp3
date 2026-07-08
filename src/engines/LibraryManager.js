import { queueManager } from './QueueManager.js';

export class LibraryManager {
  constructor() {
    this.gridElement = document.getElementById('library-grid');
    this.allTracks = [];
    this.filteredTracks = [];
  }

  setTracks(tracks) {
    this.allTracks = tracks;
    this.filteredTracks = tracks;
    this.render();
  }
  
  search(query) {
    if (!query || query.trim() === '') {
      this.filteredTracks = this.allTracks;
    } else {
      const q = query.toLowerCase().trim();
      this.filteredTracks = this.allTracks.filter(track => {
        return (
          (track.title && track.title.toLowerCase().includes(q)) ||
          (track.artist && track.artist.toLowerCase().includes(q)) ||
          (track.album && track.album.toLowerCase().includes(q)) ||
          (track.name && track.name.toLowerCase().includes(q))
        );
      });
    }
    this.render();
  }

  render() {
    if (!this.gridElement) return;
    this.gridElement.innerHTML = '';
    
    this.filteredTracks.forEach((track, index) => {
      const card = document.createElement('div');
      card.className = 'clay-surface clay-surface-interactive flex-column';
      card.style.padding = 'var(--spacing-md)';
      card.style.cursor = 'pointer';
      
      const imgContainer = document.createElement('div');
      imgContainer.style.width = '100%';
      imgContainer.style.aspectRatio = '1 / 1';
      imgContainer.style.marginBottom = 'var(--spacing-md)';
      imgContainer.style.borderRadius = 'var(--radius-md)';
      imgContainer.style.overflow = 'hidden';
      imgContainer.className = 'clay-inset flex-center';
      
      if (track.coverUrl) {
        const img = document.createElement('img');
        img.src = track.coverUrl;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        imgContainer.appendChild(img);
      } else {
        const placeholder = document.createElement('span');
        placeholder.textContent = '🎵';
        placeholder.style.fontSize = '3rem';
        imgContainer.appendChild(placeholder);
      }
      
      const title = document.createElement('h3');
      title.textContent = track.title;
      title.style.margin = '0 0 var(--spacing-xs) 0';
      title.style.fontSize = 'var(--font-size-body)';
      title.style.whiteSpace = 'nowrap';
      title.style.overflow = 'hidden';
      title.style.textOverflow = 'ellipsis';
      
      const artist = document.createElement('p');
      artist.textContent = track.artist;
      artist.style.margin = '0';
      artist.style.fontSize = 'var(--font-size-small)';
      artist.style.color = 'var(--color-text-muted)';
      artist.style.whiteSpace = 'nowrap';
      artist.style.overflow = 'hidden';
      artist.style.textOverflow = 'ellipsis';
      
      card.appendChild(imgContainer);
      card.appendChild(title);
      card.appendChild(artist);
      
      card.addEventListener('click', () => {
        // Play track from queue by setting the filtered library as the queue
        queueManager.setQueue(this.filteredTracks, index);
      });
      
      this.gridElement.appendChild(card);
    });
  }
}

export const libraryManager = new LibraryManager();
