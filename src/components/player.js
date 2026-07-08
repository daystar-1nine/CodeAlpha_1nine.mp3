import { audioEngine } from '../engines/AudioEngine.js';
import { queueManager } from '../engines/QueueManager.js';
import { visualizerEngine } from '../engines/VisualizerEngine.js';
import { metadataManager } from '../engines/MetadataManager.js';
import { libraryManager } from '../engines/LibraryManager.js';
import { storage } from '../engines/StorageEngine.js';
import { notificationEngine } from '../engines/NotificationEngine.js';
import { themeEngine } from '../engines/ThemeEngine.js';
import { animationEngine } from '../engines/AnimationEngine.js';
import { lyricsEngine } from '../engines/LyricsEngine.js';
import gsap from 'gsap';

export class PlayerComponent {
  constructor() {
    this.elements = {
      btnPlayPause: document.getElementById('btn-play-pause'),
      btnPrev: document.getElementById('btn-prev'),
      btnNext: document.getElementById('btn-next'),
      btnImport: document.getElementById('btn-import'),
      btnLibraryImport: document.getElementById('btn-library-import'),
      heroTitle: document.getElementById('hero-title'),
      heroArtist: document.getElementById('hero-artist'),
      heroArtImage: document.getElementById('hero-art-image'),
      heroArtPlaceholder: document.getElementById('hero-art-placeholder'),
      vinylRecord: document.getElementById('vinyl-record'),
      
      // Metadata
      metaFormat: document.getElementById('meta-format'),
      metaBitrate: document.getElementById('meta-bitrate'),
      metaAlbum: document.getElementById('meta-album'),
      
      // Progress
      timeCurrent: document.getElementById('time-current'),
      timeTotal: document.getElementById('time-total'),
      progressContainer: document.getElementById('progress-container'),
      progressFill: document.getElementById('progress-fill'),
      progressBuffer: document.getElementById('progress-buffer'),
      
      // Secondary Controls
      btnFavorite: document.getElementById('btn-favorite'),
      btnSpeed: document.getElementById('btn-speed'),
      labelSpeed: document.getElementById('label-speed'),
      btnSleep: document.getElementById('btn-sleep'),
      btnVisualizerToggle: document.getElementById('btn-visualizer-toggle'),
      btnLyricsToggle: document.getElementById('btn-lyrics-toggle'),
      
      // New Modals/Panels
      lyricsPanel: document.getElementById('lyrics-panel'),
      btnCloseLyrics: document.getElementById('btn-close-lyrics'),
      lyricsContainer: document.getElementById('lyrics-container'),
      
      sleepTimerModal: document.getElementById('sleep-timer-modal'),
      btnCloseSleepModal: document.getElementById('btn-close-sleep-modal'),
      btnCancelSleep: document.getElementById('btn-cancel-sleep'),
      sleepOptions: document.querySelectorAll('.sleep-option'),
      
      // Settings UI
      eqPreset: document.getElementById('eq-preset'),
      eqSlidersContainer: document.getElementById('eq-sliders'),
      sliderReverb: document.getElementById('slider-reverb'),
      sliderCrossfade: document.getElementById('slider-crossfade'),
      labelCrossfade: document.getElementById('label-crossfade'),
      settingPreservePitch: document.getElementById('setting-preserve-pitch'),
      
      // Playback Controls
      btnShuffle: document.getElementById('btn-shuffle'),
      btnRepeat: document.getElementById('btn-repeat'),
      
      // Volume & Queue
      btnMute: document.getElementById('btn-mute'),
      iconVolume: document.getElementById('icon-volume'),
      volumeContainer: document.getElementById('volume-slider-container'),
      volumeFill: document.getElementById('volume-fill'),
      btnQueue: document.getElementById('btn-queue'),
      
      // Panels
      queuePanel: document.getElementById('queue-panel'),
      btnCloseQueue: document.getElementById('btn-close-queue'),
      visualizerPanel: document.getElementById('visualizer-panel'),
      btnCloseVisualizer: document.getElementById('btn-close-visualizer'),
      progressContainer: document.getElementById('progress-container'),
      progressFill: document.getElementById('progress-fill'),
      dragOverlay: document.getElementById('drag-overlay'),
      loadingOverlay: document.getElementById('loading-overlay'),
      loadingText: document.getElementById('loading-text'),
      libraryEmptyState: document.getElementById('library-empty-state'),
      libraryGrid: document.getElementById('library-grid'),
      globalSearchInput: document.getElementById('global-search-input'),
      btnCreatePlaylist: document.getElementById('btn-create-playlist'),
      playlistNavContainer: document.getElementById('playlist-nav-container'),
    };
    
    this.init();
  }

  async init() {
    // Load tracks from storage
    try {
      const storedTracks = await storage.getAllTracks();
      if (storedTracks && storedTracks.length > 0) {
        queueManager.setQueue(storedTracks);
        libraryManager.setTracks(storedTracks);
        this.elements.libraryEmptyState.style.display = 'none';
        this.elements.libraryGrid.style.display = 'grid';
        this.elements.btnImport.style.display = 'none';
      }
    } catch (e) {
      console.warn("Could not load tracks from IndexedDB", e);
    }
    
    // Initialize Visualizer
    visualizerEngine.init('hero-visualizer-canvas');
    
    // Bind UI events
    this.elements.btnPlayPause.addEventListener('click', () => {
      audioEngine.togglePlay();
      visualizerEngine.start();
    });

    this.elements.btnPrev.addEventListener('click', () => {
      queueManager.previous();
    });

    this.elements.btnNext.addEventListener('click', () => {
      queueManager.next();
    });
    
    // Bind new UI blocks
    this.bindPanels();
    this.bindVolume();
    this.bindSecondaryControls();
    this.bindSearch();
    this.bindPlaylists();
    
    this.setupAudioSettings();
    this.setupLyrics();
    this.setupSleepTimer();
    
    let isDraggingProgress = false;
    
    const updateProgress = (e) => {
      const rect = this.elements.progressContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      this.elements.progressFill.style.width = `${percentage * 100}%`;
      if (audioEngine.audioElement.duration) {
        this.elements.timeCurrent.textContent = this.formatTime(percentage * audioEngine.audioElement.duration);
      }
    };
    
    this.elements.progressContainer.addEventListener('mousedown', (e) => {
      isDraggingProgress = true;
      updateProgress(e);
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDraggingProgress) updateProgress(e);
    });
    
    document.addEventListener('mouseup', (e) => {
      if (isDraggingProgress) {
        isDraggingProgress = false;
        const rect = this.elements.progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));
        if (audioEngine.audioElement.duration) {
          audioEngine.seek(percentage * audioEngine.audioElement.duration);
        }
      }
    });
    
    const importAction = async () => {
      try {
        await this.handleLocalFolderImport();
      } catch (err) {
        if (err.name !== 'AbortError') {
          notificationEngine.show({ title: 'Import Failed', message: err.message, type: 'error' });
        }
      }
    };
    
    this.elements.btnImport.addEventListener('click', importAction);
    if (this.elements.btnLibraryImport) {
      this.elements.btnLibraryImport.addEventListener('click', importAction);
    }

    // Drag and Drop
    document.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.elements.dragOverlay.style.display = 'flex';
    });

    document.addEventListener('dragleave', (e) => {
      e.preventDefault();
      if (e.relatedTarget === null) {
        this.elements.dragOverlay.style.display = 'none';
      }
    });

    document.addEventListener('drop', async (e) => {
      e.preventDefault();
      this.elements.dragOverlay.style.display = 'none';
      
      const items = e.dataTransfer.items;
      const files = e.dataTransfer.files;
      
      if (items && items.length > 0) {
        // Find a directory
        let foundDir = false;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === 'file' && item.webkitGetAsEntry) {
            const entry = item.webkitGetAsEntry();
            if (entry && entry.isDirectory) {
              foundDir = true;
              await this.handleDirectoryEntryImport(entry);
              break; // For now just take the first dir
            }
          }
        }
        
        // If no directory was found, try processing individual files
        if (!foundDir && files.length > 0) {
           await this.handleRawFilesImport(files);
        }
      }
    });

    // Bind Engine callbacks
    audioEngine.onPlayStateCallback = (isPlaying) => {
      // Animate Play/Pause Icon swap
      const currentIconPlay = document.getElementById('icon-play');
      const currentIconPause = document.getElementById('icon-pause');
      
      if (!currentIconPlay || !currentIconPause) return;

      const toHide = isPlaying ? currentIconPlay : currentIconPause;
      const toShow = isPlaying ? currentIconPause : currentIconPlay;
      
      gsap.to(toHide, {
        scale: 0.5, opacity: 0, duration: 0.2, ease: 'power2.in',
        onComplete: () => {
          toHide.style.display = 'none';
          toShow.style.display = 'block';
          gsap.fromTo(toShow, 
            { scale: 0.5, opacity: 0 }, 
            { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
          );
        }
      });
      
      // Also add a subtle press animation to the button itself
      gsap.fromTo(this.elements.btnPlayPause,
        { scale: 0.9 },
        { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' }
      );
      
      // Control Vinyl rotation via AnimationEngine
      animationEngine.setVinylPlaying(isPlaying);
      
      if (isPlaying) {
        visualizerEngine.start();
      } else {
        visualizerEngine.stop();
      }
    };
    
    queueManager.onTrackChangeCallback = (track) => {
      animationEngine.animateTrackChange(track, (t) => {
        this.updateHeroUI(t);
      });
      this.renderQueue(); // Re-render to highlight active track
    };
    
    queueManager.onQueueChangeCallback = (queue) => {
      this.renderQueue();
    };
    
    document.getElementById('btn-clear-queue').addEventListener('click', () => {
       queueManager.clearQueue();
    });
    
    audioEngine.onTimeUpdateCallback = (currentTime, duration) => {
      if (isNaN(duration)) return;
      if (!isDraggingProgress) {
        this.elements.timeCurrent.textContent = this.formatTime(currentTime);
        const percent = (currentTime / duration) * 100;
        this.elements.progressFill.style.width = `${percent}%`;
      }
      this.elements.timeTotal.textContent = this.formatTime(duration);
      
      // Update buffer
      const audioEl = audioEngine.audioElement;
      if (audioEl.buffered.length > 0) {
        const bufferedEnd = audioEl.buffered.end(audioEl.buffered.length - 1);
        const bufferPercent = (bufferedEnd / duration) * 100;
        this.elements.progressBuffer.style.width = `${bufferPercent}%`;
      }
    };
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  async handleLocalFolderImport() {
    if (!window.showDirectoryPicker) {
      // Fallback logic for unsupported browsers
      return this.triggerFallbackInput();
    }
    
    const directoryHandle = await window.showDirectoryPicker();
    this.elements.loadingOverlay.style.display = 'flex';
    const tracks = [];
    
    let count = 0;
    
    const scanHandle = async (handle) => {
      for await (const entry of handle.values()) {
        if (entry.kind === 'directory') {
          await scanHandle(entry);
        } else if (entry.kind === 'file') {
          const name = entry.name.toLowerCase();
          if (name.endsWith('.mp3') || name.endsWith('.flac') || name.endsWith('.wav') || name.endsWith('.m4a')) {
            this.elements.loadingText.textContent = `Scanning: ${entry.name}`;
            try {
              const track = await metadataManager.processFileHandle(entry);
              await storage.saveTrack(track);
              tracks.push(track);
              count++;
            } catch (e) {
              console.warn("Skipped corrupt file", entry.name);
            }
          }
        }
      }
    };
    
    await scanHandle(directoryHandle);
    
    this.finalizeImport(tracks, count);
  }

  // Fallback for missing File System Access API
  triggerFallbackInput() {
    let input = document.getElementById('fallback-folder-input');
    if (!input) {
      input = document.createElement('input');
      input.type = 'file';
      input.id = 'fallback-folder-input';
      input.multiple = true;
      input.webkitdirectory = true;
      input.style.display = 'none';
      document.body.appendChild(input);
    }
    
    input.onchange = async (e) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        await this.handleRawFilesImport(files);
      }
    };
    
    input.click();
  }

  async handleRawFilesImport(files) {
    this.elements.loadingOverlay.style.display = 'flex';
    const tracks = [];
    let count = 0;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const name = file.name.toLowerCase();
      if (name.endsWith('.mp3') || name.endsWith('.flac') || name.endsWith('.wav') || name.endsWith('.m4a')) {
        this.elements.loadingText.textContent = `Scanning: ${file.name}`;
        try {
          const metadata = await metadataManager.extractMetadata(file);
          const track = {
             id: file.name + '-' + file.lastModified,
             name: file.name,
             handle: { getFile: async () => file }, // mock handle
             ...metadata
          };
          // Persist the metadata (the function mock handle is stripped by StorageEngine)
          await storage.saveTrack(track); 
          tracks.push(track);
          count++;
        } catch (e) {
          console.warn("Skipped corrupt file", file.name);
        }
      }
    }
    
    this.finalizeImport(tracks, count);
  }

  // Fallback for drag and drop directory
  async handleDirectoryEntryImport(dirEntry) {
    this.elements.loadingOverlay.style.display = 'flex';
    const tracks = [];
    let count = 0;
    
    const readEntries = async (entry) => {
      if (entry.isFile) {
         const name = entry.name.toLowerCase();
         if (name.endsWith('.mp3') || name.endsWith('.flac') || name.endsWith('.wav') || name.endsWith('.m4a')) {
            this.elements.loadingText.textContent = `Scanning: ${entry.name}`;
            const file = await new Promise(r => entry.file(r));
            const mockHandle = { name: file.name, getFile: async () => file };
            try {
              const track = await metadataManager.processFileHandle(mockHandle);
              await storage.saveTrack(track);
              tracks.push(track);
              count++;
            } catch(e) {
              console.warn("Skipped", file.name);
            }
         }
      } else if (entry.isDirectory) {
         const dirReader = entry.createReader();
         let entries = [];
         
         const readAllEntries = () => new Promise((resolve, reject) => {
           const readBatch = () => {
             dirReader.readEntries((batch) => {
               if (batch.length === 0) resolve();
               else {
                 entries = entries.concat(batch);
                 readBatch();
               }
             }, reject);
           };
           readBatch();
         });
         
         await readAllEntries();
         
         for (let child of entries) {
           await readEntries(child);
         }
      }
    };
    
    await readEntries(dirEntry);
    this.finalizeImport(tracks, count);
  }

  finalizeImport(tracks, count) {
    this.elements.loadingOverlay.style.display = 'none';
    if (tracks.length > 0) {
      queueManager.setQueue(tracks);
      libraryManager.setTracks(tracks);
      
      this.elements.libraryEmptyState.style.display = 'none';
      this.elements.libraryGrid.style.display = 'grid';
      this.elements.btnImport.style.display = 'none';
      
      notificationEngine.show({
        title: 'Import Complete',
        message: `Successfully added ${count} tracks to library.`,
        type: 'success'
      });
    } else {
      notificationEngine.show({
        title: 'Import Failed',
        message: 'No supported music files found.',
        type: 'error'
      });
    }
  }

  updateHeroUI(track) {
    if (!track) return;
    this.elements.heroTitle.textContent = track.title || 'Unknown Title';
    this.elements.heroArtist.textContent = track.artist || 'Unknown Artist';
    
    if (track.coverUrl) {
      this.elements.heroArtImage.src = track.coverUrl;
      this.elements.heroArtImage.style.display = 'block';
      this.elements.heroArtPlaceholder.style.display = 'none';
      this.elements.vinylRecord.style.display = 'block';
    } else {
      this.elements.heroArtImage.style.display = 'none';
      this.elements.heroArtPlaceholder.style.display = 'flex';
      this.elements.vinylRecord.style.display = 'block';
    }
    
    // Update Meta
    this.elements.metaFormat.textContent = track.format || '--';
    this.elements.metaBitrate.textContent = track.bitrate || 'Unknown';
    this.elements.metaAlbum.textContent = track.album || 'Unknown Album';
    
    // Apply dynamic theme
    themeEngine.applyThemeFromImage(track.coverUrl);
  }

  renderQueue() {
    const queueList = document.getElementById('queue-list');
    const queueEmpty = document.getElementById('queue-empty-state');
    const queueCount = document.getElementById('queue-count');
    
    if (!queueList || !queueEmpty) return;
    
    const queue = queueManager.queue;
    queueCount.textContent = `${queue.length} tracks`;
    
    if (queue.length === 0) {
      queueList.innerHTML = '';
      queueList.appendChild(queueEmpty);
      queueEmpty.style.display = 'flex';
      return;
    }
    
    queueEmpty.style.display = 'none';
    queueList.innerHTML = '';
    
    queue.forEach((track, index) => {
      const isActive = index === queueManager.currentIndex;
      
      const item = document.createElement('div');
      item.className = `queue-item flex-row ${isActive ? 'active' : ''}`;
      item.style.cssText = `
        padding: 0.75rem; 
        border-radius: var(--radius-md); 
        background: ${isActive ? 'var(--color-primary)' : 'var(--color-surface)'}; 
        color: ${isActive ? '#fff' : 'var(--color-text-main)'};
        display: flex; 
        align-items: center; 
        gap: 1rem; 
        cursor: pointer;
        transition: background 0.3s ease, transform 0.2s ease;
      `;
      
      if (!isActive) {
        item.addEventListener('mouseenter', () => item.style.transform = 'translateX(5px)');
        item.addEventListener('mouseleave', () => item.style.transform = 'translateX(0)');
      }
      
      const img = document.createElement('img');
      img.src = track.coverUrl || '';
      img.style.cssText = 'width: 40px; height: 40px; border-radius: 4px; object-fit: cover;';
      
      const info = document.createElement('div');
      info.className = 'flex-column';
      info.style.cssText = 'flex-grow: 1; overflow: hidden;';
      
      const title = document.createElement('span');
      title.textContent = track.title;
      title.style.cssText = 'font-weight: 600; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;';
      
      const artist = document.createElement('span');
      artist.textContent = track.artist;
      artist.style.cssText = `font-size: 0.8rem; color: ${isActive ? 'rgba(255,255,255,0.8)' : 'var(--color-text-muted)'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;`;
      
      info.appendChild(title);
      info.appendChild(artist);
      
      item.appendChild(img);
      item.appendChild(info);
      
      if (isActive) {
        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', 'bar-chart-2');
        icon.style.cssText = 'width: 20px; height: 20px; color: #fff;';
        item.appendChild(icon);
      } else {
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i data-lucide="x" style="width:16px;height:16px;"></i>';
        removeBtn.style.cssText = 'background:none; border:none; color:inherit; opacity: 0.5; cursor: pointer; padding: 4px;';
        removeBtn.addEventListener('mouseenter', () => removeBtn.style.opacity = '1');
        removeBtn.addEventListener('mouseleave', () => removeBtn.style.opacity = '0.5');
        
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          queueManager.removeTrack(index);
        });
        item.appendChild(removeBtn);
      }
      
      item.addEventListener('click', () => {
        if (!isActive) queueManager.playTrackAtIndex(index);
      });
      
      queueList.appendChild(item);
    });
    
    if (window.lucide) window.lucide.createIcons();
  }

  bindPanels() {
    const togglePanel = (panel, isOpen) => {
      const isMobile = window.innerWidth <= 768;
      const isLeft = panel.id === 'visualizer-panel';
      
      if (isOpen) {
        panel.style.display = 'flex';
        if (isMobile) {
          gsap.fromTo(panel, 
            { y: '100%', x: '0%' }, 
            { y: '0%', duration: 0.6, ease: 'power4.out', overwrite: 'auto' }
          );
        } else {
          gsap.fromTo(panel, 
            { x: isLeft ? '-100%' : '100%', y: '0%' }, 
            { x: '0%', duration: 0.6, ease: 'power4.out', overwrite: 'auto' }
          );
        }
      } else {
        if (isMobile) {
          gsap.to(panel, {
            y: '100%', 
            duration: 0.4, 
            ease: 'power2.in',
            overwrite: 'auto',
            onComplete: () => { panel.style.display = 'none'; }
          });
        } else {
          gsap.to(panel, {
            x: isLeft ? '-100%' : '100%', 
            duration: 0.4, 
            ease: 'power2.in',
            overwrite: 'auto',
            onComplete: () => { panel.style.display = 'none'; }
          });
        }
      }
    };

      this.elements.btnQueue.addEventListener('click', () => {
        this.queueOpen = !this.queueOpen;
        if (this.queueOpen) this.elements.btnQueue.classList.add('nav-active');
        else this.elements.btnQueue.classList.remove('nav-active');
        togglePanel(this.elements.queuePanel, this.queueOpen);
      });

      this.elements.btnCloseQueue.addEventListener('click', () => {
        this.queueOpen = false;
        this.elements.btnQueue.classList.remove('nav-active');
        togglePanel(this.elements.queuePanel, false);
      });

      this.elements.btnVisualizerToggle.addEventListener('click', () => {
        this.vizOpen = !this.vizOpen;
        if (this.vizOpen) this.elements.btnVisualizerToggle.classList.add('nav-active');
        else this.elements.btnVisualizerToggle.classList.remove('nav-active');
       if (this.elements.visualizerPanel) {
        if (this.elements.visualizerPanel.style.display === 'flex') {
          togglePanel(this.elements.visualizerPanel, false);
        } else {
          togglePanel(this.elements.visualizerPanel, true);
          if (this.elements.queuePanel.style.display === 'flex') {
            togglePanel(this.elements.queuePanel, false);
          }
        }
      }
    });

      this.elements.btnCloseVisualizer.addEventListener('click', () => {
        this.vizOpen = false;
        this.elements.btnVisualizerToggle.classList.remove('nav-active');
        togglePanel(this.elements.visualizerPanel, false);
      });
      
      const btnCollapse = document.getElementById('btn-collapse-sidebar');
      const sidebar = document.getElementById('sidebar');
      if (btnCollapse && sidebar) {
        btnCollapse.addEventListener('click', () => {
          sidebar.classList.toggle('collapsed');
          const icon = btnCollapse.querySelector('i');
          if (sidebar.classList.contains('collapsed')) {
            icon.setAttribute('data-lucide', 'panel-left-open');
          } else {
            icon.setAttribute('data-lucide', 'panel-left-close');
          }
          if (window.lucide) window.lucide.createIcons();
        });
      }
  }

  bindSearch() {
    if (this.elements.globalSearchInput) {
      this.elements.globalSearchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        libraryManager.search(query);
        
        // Auto-switch to library view if searching
        if (query.length > 0 && this.currentView !== 'library') {
          this.switchView('library');
        }
      });
    }
  }

  bindPlaylists() {
    const btnMostPlayed = document.querySelector('[data-playlist="most-played"]');
    if (btnMostPlayed) {
      btnMostPlayed.addEventListener('click', () => {
        // Sort by playCount desc
        const sorted = [...libraryManager.allTracks].sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
        // Take top 50
        const top = sorted.slice(0, 50);
        if(top.length > 0) {
           queueManager.setQueue(top, 0);
           notificationEngine.show({ title: 'Most Played', message: 'Playing your favorite tracks.', type: 'info' });
        } else {
           notificationEngine.show({ title: 'Most Played', message: 'Not enough data yet.', type: 'warning' });
        }
      });
    }

    const btnRecentlyAdded = document.querySelector('[data-playlist="recently-added"]');
    if (btnRecentlyAdded) {
      btnRecentlyAdded.addEventListener('click', () => {
        // Assume allTracks is in chronological insertion order (IDB default for auto-increment), so reverse it
        const recent = [...libraryManager.allTracks].reverse().slice(0, 50);
        if (recent.length > 0) {
           queueManager.setQueue(recent, 0);
           notificationEngine.show({ title: 'Recently Added', message: 'Playing newest tracks.', type: 'info' });
        } else {
           notificationEngine.show({ title: 'Recently Added', message: 'Your library is empty.', type: 'warning' });
        }
      });
    }
  }

  bindVolume() {
    let isDragging = false;
    const updateVolume = (e) => {
      const rect = this.elements.volumeContainer.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      audioEngine.setVolume(percentage);
      this.elements.volumeFill.style.width = `${percentage * 100}%`;
      
      // Update icon based on volume level
      const icon = this.elements.iconVolume;
      if (percentage === 0) icon.setAttribute('data-lucide', 'volume-x');
      else if (percentage < 0.5) icon.setAttribute('data-lucide', 'volume-1');
      else icon.setAttribute('data-lucide', 'volume-2');
      if (window.lucide) window.lucide.createIcons({ name: icon.getAttribute('data-lucide') });
    };

    this.elements.volumeContainer.addEventListener('mousedown', (e) => {
      isDragging = true;
      updateVolume(e);
    });
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) updateVolume(e);
    });
    
    document.addEventListener('mouseup', () => {
      isDragging = false;
    });

    this.elements.volumeContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      const currentVol = audioEngine.audioElement.volume;
      const newVol = e.deltaY < 0 ? Math.min(1, currentVol + 0.05) : Math.max(0, currentVol - 0.05);
      audioEngine.setVolume(newVol);
      this.elements.volumeFill.style.width = `${newVol * 100}%`;
    });

    this.elements.btnMute.addEventListener('click', () => {
      const currentVol = audioEngine.audioElement.volume;
      if (currentVol > 0) {
        this.lastVolume = currentVol;
        audioEngine.setVolume(0);
        this.elements.volumeFill.style.width = `0%`;
        this.elements.iconVolume.setAttribute('data-lucide', 'volume-x');
      } else {
        const vol = this.lastVolume || 1;
        audioEngine.setVolume(vol);
        this.elements.volumeFill.style.width = `${vol * 100}%`;
        this.elements.iconVolume.setAttribute('data-lucide', vol < 0.5 ? 'volume-1' : 'volume-2');
      }
      if (window.lucide) window.lucide.createIcons({ name: this.elements.iconVolume.getAttribute('data-lucide') });
    });
  }

  bindSecondaryControls() {
    this.elements.btnShuffle.addEventListener('click', () => {
       queueManager.toggleShuffle();
       if (queueManager.isShuffled) this.elements.btnShuffle.classList.add('nav-active');
       else this.elements.btnShuffle.classList.remove('nav-active');
    });

    this.elements.btnRepeat.addEventListener('click', () => {
       queueManager.toggleRepeat();
       const icon = this.elements.btnRepeat.querySelector('i');
       if (queueManager.repeatMode === 'none') {
         this.elements.btnRepeat.classList.remove('nav-active');
         icon.setAttribute('data-lucide', 'repeat');
       } else if (queueManager.repeatMode === 'all') {
         this.elements.btnRepeat.classList.add('nav-active');
         icon.setAttribute('data-lucide', 'repeat');
       } else {
         this.elements.btnRepeat.classList.add('nav-active');
         icon.setAttribute('data-lucide', 'repeat-1');
       }
       if (window.lucide) window.lucide.createIcons({ name: icon.getAttribute('data-lucide') });
    });
    
    const speeds = [1, 1.25, 1.5, 2, 0.75];
    let speedIndex = 0;
    this.elements.btnSpeed.addEventListener('click', () => {
       speedIndex = (speedIndex + 1) % speeds.length;
       const speed = speeds[speedIndex];
       audioEngine.audioElement.playbackRate = speed;
       this.elements.labelSpeed.textContent = `${speed}x`;
       if (speed !== 1) this.elements.btnSpeed.classList.add('nav-active');
       else this.elements.btnSpeed.classList.remove('nav-active');
    });
    
    const vizButtons = document.querySelectorAll('#visualizer-modes button');
    vizButtons.forEach(btn => {
      if (btn.id === 'btn-performance-mode') return; // Handled separately
      
      btn.addEventListener('click', () => {
         const mode = btn.getAttribute('data-mode');
         if (mode && mode !== 'wave') {
           visualizerEngine.setMode(mode);
           vizButtons.forEach(b => {
             if (b.id !== 'btn-performance-mode') {
               b.style.background = 'var(--color-bg-base)';
               b.style.color = 'var(--color-text-main)';
             }
           });
           btn.style.background = 'var(--color-primary)';
           btn.style.color = 'white';
         }
      });
    });
    
    const btnPerf = document.getElementById('btn-performance-mode');
    let isPerformanceMode = false;
    if (btnPerf) {
      btnPerf.addEventListener('click', () => {
        isPerformanceMode = !isPerformanceMode;
        if (isPerformanceMode) {
          document.body.classList.add('performance-mode');
          btnPerf.classList.add('nav-active');
          btnPerf.innerHTML = '<i data-lucide="zap" style="margin-right: 12px; color: var(--color-primary);"></i> Performance Mode: On';
        } else {
          document.body.classList.remove('performance-mode');
          btnPerf.classList.remove('nav-active');
          btnPerf.innerHTML = '<i data-lucide="zap" style="margin-right: 12px;"></i> Performance Mode: Off';
        }
        if (window.lucide) window.lucide.createIcons();
      });
    }
  }

  setupAudioSettings() {
    const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    const labels = ['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'];
    
    this.eqSliders = [];
    if(this.elements.eqSlidersContainer) {
      frequencies.forEach((freq, i) => {
        const col = document.createElement('div');
        col.className = 'flex-column';
        col.style.alignItems = 'center';
        col.style.gap = '0.5rem';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = -12;
        slider.max = 12;
        slider.step = 0.1;
        slider.value = 0;
        slider.style.writingMode = 'vertical-lr';
        slider.style.direction = 'rtl';
        slider.style.width = '24px';
        slider.style.height = '120px';
        slider.style.WebkitAppearance = 'slider-vertical';
        
        const label = document.createElement('span');
        label.textContent = labels[i];
        label.style.fontSize = '0.75rem';
        label.style.fontWeight = '600';
        label.style.color = 'var(--color-text-muted)';
        
        slider.addEventListener('input', (e) => {
          audioEngine.setEQBand(i, parseFloat(e.target.value));
          this.elements.eqPreset.value = 'custom';
        });
        
        col.appendChild(slider);
        col.appendChild(label);
        this.elements.eqSlidersContainer.appendChild(col);
        this.eqSliders.push(slider);
      });
    }

    if(this.elements.eqPreset) {
      this.elements.eqPreset.addEventListener('change', (e) => {
        const preset = e.target.value;
        if (preset !== 'custom') {
          audioEngine.setEQPreset(preset);
          const values = audioEngine.eqPresets[preset];
          this.eqSliders.forEach((slider, i) => {
            slider.value = values[i];
          });
        }
      });
    }

    if(this.elements.sliderReverb) {
      this.elements.sliderReverb.addEventListener('input', (e) => {
        audioEngine.setReverbLevel(parseFloat(e.target.value));
      });
    }

    if(this.elements.sliderCrossfade) {
      this.elements.sliderCrossfade.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        audioEngine.setCrossfade(val);
        this.elements.labelCrossfade.textContent = val === 0 ? '0s (Off)' : val + 's';
      });
    }

    if(this.elements.settingPreservePitch) {
      this.elements.settingPreservePitch.addEventListener('change', (e) => {
        const currentSpeed = parseFloat(this.elements.labelSpeed.textContent) || 1.0;
        audioEngine.setSpeed(currentSpeed, e.target.checked);
      });
    }
  }

  setupLyrics() {
    if(this.elements.btnLyricsToggle) {
      this.elements.btnLyricsToggle.addEventListener('click', () => {
        if (this.elements.lyricsPanel.style.display === 'none') {
          this.elements.lyricsPanel.style.display = 'flex';
          gsap.fromTo(this.elements.lyricsPanel, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 });
          
          // Fetch lyrics if not loaded
          const track = queueManager.queue[queueManager.currentIndex];
          if(track) {
            lyricsEngine.fetchLyrics(track.title || track.name, track.artist || 'Unknown Artist');
          }
        } else {
          gsap.to(this.elements.lyricsPanel, { opacity: 0, y: 20, duration: 0.3, onComplete: () => {
            this.elements.lyricsPanel.style.display = 'none';
          }});
        }
      });
    }
    
    if(this.elements.btnCloseLyrics) {
      this.elements.btnCloseLyrics.addEventListener('click', () => {
        gsap.to(this.elements.lyricsPanel, { opacity: 0, y: 20, duration: 0.3, onComplete: () => {
          this.elements.lyricsPanel.style.display = 'none';
        }});
      });
    }

    // Attach to engine
    audioEngine.onTimeUpdateCallback = (currentTime, duration) => {
      // Original time update logic
      if (this.elements.timeCurrent) this.elements.timeCurrent.textContent = this.formatTime(currentTime);
      if (this.elements.timeTotal && duration && duration !== Infinity) this.elements.timeTotal.textContent = this.formatTime(duration);
      if (duration && this.elements.progressFill && this.elements.progressBuffer) {
        this.elements.progressFill.style.width = `${(currentTime / duration) * 100}%`;
      }
      
      // Update Lyrics
      lyricsEngine.updateTime(currentTime);
    };
    
    lyricsEngine.onLyricChangeCallback = (index, text) => {
      if(!this.elements.lyricsContainer) return;
      
      if(index === -1) {
        // Just render the list
        this.elements.lyricsContainer.innerHTML = '';
        if(lyricsEngine.lyrics.length === 0) {
           this.elements.lyricsContainer.innerHTML = '<p style="font-size: 2rem; font-weight: 700; color: rgba(255,255,255,0.5);">No lyrics available</p>';
        } else {
           lyricsEngine.lyrics.forEach((line, i) => {
             const p = document.createElement('p');
             p.textContent = line.text;
             p.style.fontSize = '2rem';
             p.style.fontWeight = '700';
             p.style.color = 'rgba(255,255,255,0.5)';
             p.style.transition = 'all 0.3s ease';
             p.style.textAlign = 'center';
             p.style.margin = '1rem 0';
             p.style.cursor = 'pointer';
             p.addEventListener('click', () => {
                audioEngine.seek(line.time);
             });
             this.elements.lyricsContainer.appendChild(p);
           });
        }
      } else {
        const pElements = this.elements.lyricsContainer.querySelectorAll('p');
        pElements.forEach((p, i) => {
          if (i === index) {
            p.style.color = 'var(--color-primary)';
            p.style.transform = 'scale(1.1)';
            p.style.opacity = '1';
            p.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            p.style.color = 'rgba(255,255,255,0.5)';
            p.style.transform = 'scale(1)';
            p.style.opacity = '0.7';
          }
        });
      }
    };
    
    // Fetch lyrics on track change
    const oldChange = queueManager.onTrackChangeCallback;
    queueManager.onTrackChangeCallback = (track) => {
       if (oldChange) oldChange(track);
       if (this.elements.lyricsPanel && this.elements.lyricsPanel.style.display !== 'none') {
          lyricsEngine.fetchLyrics(track.title || track.name, track.artist || 'Unknown Artist').then(() => {
             lyricsEngine.onLyricChangeCallback(-1, null);
          });
       } else {
          lyricsEngine.lyrics = []; // Clear
       }
    };
  }

  setupSleepTimer() {
    let sleepTimeout = null;
    let fadeInterval = null;

    if(this.elements.btnSleep) {
      this.elements.btnSleep.addEventListener('click', () => {
        this.elements.sleepTimerModal.showModal();
      });
    }

    if(this.elements.btnCloseSleepModal) {
      this.elements.btnCloseSleepModal.addEventListener('click', () => {
        this.elements.sleepTimerModal.close();
      });
    }

    if(this.elements.btnCancelSleep) {
      this.elements.btnCancelSleep.addEventListener('click', () => {
        if (sleepTimeout) clearTimeout(sleepTimeout);
        if (fadeInterval) clearInterval(fadeInterval);
        audioEngine.setVolume(1); 
        this.elements.sleepTimerModal.close();
        notificationEngine.show({ title: 'Sleep Timer', message: 'Timer Cancelled', type: 'info' });
        this.elements.btnSleep.style.color = '';
      });
    }

    if(this.elements.sleepOptions) {
      this.elements.sleepOptions.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const mins = parseInt(e.target.getAttribute('data-time'));
          
          if (sleepTimeout) clearTimeout(sleepTimeout);
          if (fadeInterval) clearInterval(fadeInterval);
          
          this.elements.btnSleep.style.color = 'var(--color-primary)';
          notificationEngine.show({ title: 'Sleep Timer Set', message: 'Audio will stop in ' + mins + ' minutes.', type: 'info' });
          this.elements.sleepTimerModal.close();
          
          const ms = mins * 60 * 1000;
          
          sleepTimeout = setTimeout(() => {
            let vol = 1;
            fadeInterval = setInterval(() => {
              vol -= 0.1;
              if (vol <= 0) {
                vol = 0;
                clearInterval(fadeInterval);
                audioEngine.pause();
                this.elements.btnSleep.style.color = '';
              }
              audioEngine.setVolume(vol);
            }, 1000);
          }, ms - 10000); 
        });
      });
    }
  }
}
