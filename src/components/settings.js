import { storage } from '../engines/StorageEngine.js';
import { queueManager } from '../engines/QueueManager.js';
import { libraryManager } from '../engines/LibraryManager.js';
import { notificationEngine } from '../engines/NotificationEngine.js';

export class SettingsManager {
  constructor() {
    this.darkModeToggle = document.getElementById('setting-dark-mode');
    this.btnClearLibrary = document.getElementById('btn-clear-library');
    this.init();
  }

  async init() {
    this.themeButtons = document.querySelectorAll('.theme-btn');
    // Load Settings
    const isDark = await storage.getSetting('darkMode');
    if (isDark !== null) {
      this.darkModeToggle.checked = isDark;
      this.applyDarkMode(isDark);
    }
    
    const savedTheme = await storage.getSetting('themeMode');
    if (savedTheme) {
      this.applyTheme(savedTheme);
    }

    this.darkModeToggle.addEventListener('change', async (e) => {
      const isDark = e.target.checked;
      await storage.saveSetting('darkMode', isDark);
      this.applyDarkMode(isDark);
    });
    
    this.themeButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const theme = btn.dataset.theme;
        this.applyTheme(theme);
        await storage.saveSetting('themeMode', theme);
      });
    });
    
    this.btnClearLibrary.addEventListener('click', async () => {
      if (confirm('Are you sure you want to clear your entire library? This cannot be undone.')) {
        await storage.clearTracks();
        queueManager.setQueue([]);
        libraryManager.setTracks([]);
        
        // Hide grid, show empty state
        document.getElementById('library-empty-state').style.display = 'flex';
        document.getElementById('library-grid').style.display = 'none';
        
        notificationEngine.show({ title: 'Library Cleared', message: 'Your library has been emptied.', type: 'info' });
      }
    });
  }

  applyDarkMode(isDark) {
    if (isDark) {
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
    }
  }

  applyTheme(themeName) {
    import('../engines/ThemeEngine.js').then(({ themeEngine }) => {
      themeEngine.applyThemePreset(themeName);
      
      // Update UI selection state
      this.themeButtons.forEach(btn => {
        if (btn.dataset.theme === themeName) {
          btn.style.border = '2px solid var(--color-primary)';
        } else {
          btn.style.border = 'none';
        }
      });
      
      // If dynamic, attempt to re-extract from current queue track
      if (themeName === 'dynamic') {
         const currentTrack = queueManager.queue[queueManager.currentIndex];
         if (currentTrack && currentTrack.coverUrl) {
           themeEngine.applyThemeFromImage(currentTrack.coverUrl);
         } else {
           themeEngine.applyDefaultTheme();
         }
      }
    });
  }
}

export const settingsManager = new SettingsManager();
