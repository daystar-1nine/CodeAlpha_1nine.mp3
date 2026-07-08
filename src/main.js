import './styles/main.css';
import gsap from 'gsap';
import { storage } from './engines/StorageEngine.js';
import { metadataManager } from './engines/MetadataManager.js';
import { audioEngine } from './engines/AudioEngine.js';
import { queueManager } from './engines/QueueManager.js';
import { themeEngine } from './engines/ThemeEngine.js';
import { PlayerComponent } from './components/player.js';
import { SidebarComponent } from './components/sidebar.js';
import { settingsManager } from './components/settings.js';
import { microInteractionsEngine } from './engines/MicroInteractionsEngine.js';

class App {
  constructor() {
    this.init();
  }

  async init() {
    console.log("1nine.mp3 Initialized");
    
    // Initialize storage
    await storage.init();
    console.log("Storage Engine initialized.");
    
    this.playerComponent = new PlayerComponent();
    this.sidebarComponent = new SidebarComponent();

    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    this.setupBasicMotion();
  }

  setupBasicMotion() {
    // Initial GSAP animation to show the premium feel
    gsap.from('#sidebar', {
      x: -300,
      opacity: 0,
      duration: 1,
      ease: "power3.out"
    });

    gsap.from('#hero-player', {
      y: 50,
      opacity: 0,
      duration: 1.2,
      delay: 0.3,
      ease: "power4.out"
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.OneNineApp = new App();
});
