import gsap from 'gsap';

export class MicroInteractionsEngine {
  constructor() {
    this.initInteractiveElements();
  }

  initInteractiveElements() {
    // Select all interactive clay elements
    const elements = document.querySelectorAll('.clay-surface-interactive');
    
    elements.forEach(el => {
      // Hover physics
      el.addEventListener('mouseenter', () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        
        gsap.to(el, {
          y: -4,
          scale: 1.05,
          boxShadow: '0 15px 25px var(--color-ambient-1), var(--clay-shadow-hover)',
          duration: 0.4,
          ease: 'power3.out',
          overwrite: 'auto'
        });
      });

      el.addEventListener('mouseleave', () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        
        // Return to normal
        // Special case for play button which has a default custom state
        if (el.id === 'btn-play-pause') {
            gsap.to(el, {
                y: 0,
                scale: 1,
                boxShadow: '0 10px 20px var(--color-ambient-1), var(--clay-shadow-outset)',
                duration: 0.6,
                ease: 'power2.out',
                overwrite: 'auto'
            });
            return;
        }

        gsap.to(el, {
          y: 0,
          scale: 1,
          boxShadow: 'var(--clay-shadow-outset)',
          duration: 0.6,
          ease: 'power2.out',
          overwrite: 'auto'
        });
      });

      // Click physics
      el.addEventListener('mousedown', () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        
        gsap.to(el, {
          y: 2,
          scale: 0.95,
          boxShadow: 'var(--clay-shadow-active)',
          duration: 0.1,
          ease: 'power1.inOut',
          overwrite: 'auto'
        });
      });

      el.addEventListener('mouseup', () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        
        // Elastic release to hover state
        gsap.to(el, {
          y: -4,
          scale: 1.05,
          boxShadow: '0 15px 25px var(--color-ambient-1), var(--clay-shadow-hover)',
          duration: 0.8,
          ease: 'elastic.out(1, 0.4)',
          overwrite: 'auto'
        });
      });
      
    });
  }
}

export const microInteractionsEngine = new MicroInteractionsEngine();
