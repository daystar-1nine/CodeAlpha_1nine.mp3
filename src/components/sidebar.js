import { animationEngine } from '../engines/AnimationEngine.js';

export class SidebarComponent {
  constructor() {
    this.navHome = document.getElementById('nav-home');
    this.navLibrary = document.getElementById('nav-library');
    this.navSettings = document.getElementById('nav-settings');
    
    this.init();
  }

  init() {
    this.navHome.addEventListener('click', () => {
      animationEngine.navigateToHero();
    });

    this.navLibrary.addEventListener('click', () => {
      animationEngine.navigateToLibrary();
    });
    
    this.navSettings.addEventListener('click', () => {
      animationEngine.navigateToSettings();
    });
  }
}
