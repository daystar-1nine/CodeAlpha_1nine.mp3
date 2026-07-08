import gsap from 'gsap';

export class AnimationEngine {
  constructor() {
    this.heroPlayer = document.getElementById('hero-player');
    this.libraryView = document.getElementById('library-view');
    this.settingsView = document.getElementById('settings-view');
    this.vinylRecord = document.getElementById('vinyl-record');
    this.currentView = 'hero';
    
    // Elements for track transitions
    this.heroTitle = document.getElementById('hero-title');
    this.heroArtist = document.getElementById('hero-artist');
    this.heroArtImage = document.getElementById('hero-art-image');
    this.vinylLabel = document.getElementById('vinyl-inner-label');
    
    this.initVinylAnimation();
  }

  initVinylAnimation() {
    if (!this.vinylRecord) return;
    
    // Create an infinite rotation tween
    this.vinylTween = gsap.to(this.vinylRecord, {
      rotation: 360,
      duration: 8,
      repeat: -1,
      ease: 'none',
      paused: true
    });
  }

  setVinylPlaying(isPlaying) {
    if (!this.vinylTween) return;
    
    if (isPlaying) {
      this.vinylTween.play();
      gsap.to(this.vinylTween, { timeScale: 1, duration: 1, ease: 'power1.in' });
    } else {
      // Smoothly slow down to 0
      gsap.to(this.vinylTween, { 
        timeScale: 0, 
        duration: 1.5, 
        ease: 'power2.out',
        onComplete: () => {
          if (this.vinylTween.timeScale() === 0) {
            this.vinylTween.pause();
          }
        }
      });
    }
  }

  animateTrackChange(track, updateUICallback) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
       updateUICallback(track);
       return;
    }

    const tl = gsap.timeline();

    // 1. Soft fade and slight scale down
    tl.to([this.heroArtImage, this.heroTitle, this.heroArtist, this.vinylRecord], {
      opacity: 0,
      scale: 0.95,
      y: 10,
      duration: 0.4,
      ease: 'power2.inOut',
      onComplete: () => {
        // 2. Callback to update DOM text and src attributes
        updateUICallback(track);
      }
    })
    .to([this.heroArtImage, this.vinylRecord], {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out'
    }, '+=0.2') // Slight pause for background morphing feeling
    .to(this.heroTitle, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.6,
      ease: 'back.out(1.5)'
    }, '-=0.6')
    .to(this.heroArtist, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.6,
      ease: 'power2.out'
    }, '-=0.4');
  }

  navigateToLibrary() {
    if (this.currentView === 'library') return;
    const oldView = this.currentView;
    this.currentView = 'library';
    
    // Fade out main content
    gsap.to(document.getElementById(`view-${oldView}`), {
      opacity: 0,
      y: -20,
      duration: 0.3,
      onComplete: () => {
        const oldEl = document.getElementById(`view-${oldView}`);
        oldEl.classList.remove('active');
        gsap.set(oldEl, { clearProps: 'opacity,y' });
        
        document.getElementById('view-library').classList.add('active');
      }
    });

    this._hideOldView(oldView);
    
    // Animate Hero player out to mini player state
    this.heroPlayer.style.display = ''; // Ensure it's not hidden
    gsap.to(this.heroPlayer, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        document.getElementById('hero-card').classList.add('mini-player-mode');
        gsap.to(this.heroPlayer, { opacity: 1, duration: 0.5 });
      }
    });

    // Fade in library
    this.libraryView.style.display = 'block';
    gsap.fromTo(this.libraryView, 
      { opacity: 0, y: 50 }, 
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.3 }
    );
  }

  navigateToHero() {
    if (this.currentView === 'hero') return;
    const oldView = this.currentView;
    this.currentView = 'hero';
    
    // Fade out main content
    gsap.to(document.getElementById(`view-${oldView}`), {
      opacity: 0,
      y: -20,
      duration: 0.3,
      onComplete: () => {
        const oldEl = document.getElementById(`view-${oldView}`);
        oldEl.classList.remove('active');
        gsap.set(oldEl, { clearProps: 'opacity,y' });
        
        document.getElementById('view-hero').classList.add('active');
      }
    });

    this._hideOldView(oldView);

    // Restore Hero player from mini player state
    this.heroPlayer.style.display = ''; // Ensure it's not hidden
    gsap.to(this.heroPlayer, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        document.getElementById('hero-card').classList.remove('mini-player-mode');
        gsap.to(this.heroPlayer, { opacity: 1, scale: 1, duration: 0.5 });
      }
    });
  }
  
  navigateToSettings() {
    if (this.currentView === 'settings') return;
    const oldView = this.currentView;
    this.currentView = 'settings';
    
    // Fade out main content
    gsap.to(document.getElementById(`view-${oldView}`), {
      opacity: 0,
      y: -20,
      duration: 0.3,
      onComplete: () => {
        const oldEl = document.getElementById(`view-${oldView}`);
        oldEl.classList.remove('active');
        gsap.set(oldEl, { clearProps: 'opacity,y' });
        
        document.getElementById('view-settings').classList.add('active');
      }
    });

    this._hideOldView(oldView);
    
    // Fade in settings
    this.settingsView.style.display = 'block';
    gsap.fromTo(this.settingsView, 
      { opacity: 0, y: 50 }, 
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.3 }
    );
  }
  
  _hideOldView(oldView) {
    if (oldView === 'library') {
      gsap.to(this.libraryView, {
        opacity: 0, y: 20, duration: 0.5, ease: 'power2.in',
        onComplete: () => { 
          this.libraryView.style.display = 'none'; 
          gsap.set(this.libraryView, { clearProps: 'opacity,y' });
        }
      });
    } else if (oldView === 'settings') {
      gsap.to(this.settingsView, {
        opacity: 0, y: 20, duration: 0.5, ease: 'power2.in',
        onComplete: () => { 
          this.settingsView.style.display = 'none'; 
          gsap.set(this.settingsView, { clearProps: 'opacity,y' });
        }
      });
    } else if (oldView === 'hero' && this.currentView === 'settings') {
      // Hide hero entirely for settings
      gsap.to(this.heroPlayer, {
        opacity: 0, scale: 0.8, duration: 0.5, ease: 'power2.in',
        onComplete: () => { this.heroPlayer.style.display = 'none'; }
      });
    }
    
    // Restore hero if returning from settings to library
    if (oldView === 'settings' && this.currentView === 'library') {
      this.heroPlayer.style.display = 'block';
    }
  }
}

export const animationEngine = new AnimationEngine();

// Allow clicking the mini player to restore the hero view
document.addEventListener('DOMContentLoaded', () => {
  const heroCard = document.getElementById('hero-card');
  if (heroCard) {
    heroCard.addEventListener('click', (e) => {
      if (heroCard.classList.contains('mini-player-mode')) {
        // Only navigate if they didn't click a button
        if (!e.target.closest('button')) {
          animationEngine.navigateToHero();
          // Update sidebar active state
          document.querySelectorAll('.sidebar-nav button').forEach(b => b.classList.remove('nav-active'));
          document.getElementById('nav-home').classList.add('nav-active');
        }
      }
    });
  }
});
