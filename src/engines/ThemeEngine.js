import gsap from 'gsap';
import { visualizerEngine } from './VisualizerEngine.js';

export class ThemeEngine {
  constructor() {
    this.colorThief = window.ColorThief ? new window.ColorThief() : null;
    this.root = document.documentElement;
    this.ambientAnimation = null;
    this.currentMode = 'dynamic'; // 'dynamic' or 'preset-name'
    this.startAmbientAnimation();
  }

  startAmbientAnimation() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
       return; // Respect reduced motion
    }
    
    // Continuous subtle breathing motion using GSAP for the ambient layers
    const layer1 = document.getElementById('ambient-layer-1');
    const layer2 = document.getElementById('ambient-layer-2');
    const layer3 = document.getElementById('ambient-layer-3');
    
    if (!layer1 || !layer2 || !layer3) return;

    this.ambientAnimation = gsap.timeline({ repeat: -1, yoyo: true });
    
    this.ambientAnimation.to(layer1, {
      x: '10vw', y: '5vh', scale: 1.1, opacity: 0.8, duration: 20, ease: 'sine.inOut'
    }, 0).to(layer2, {
      x: '-8vw', y: '-10vh', scale: 1.2, opacity: 0.7, duration: 25, ease: 'sine.inOut'
    }, 0).to(layer3, {
      x: '5vw', y: '8vh', scale: 1.3, opacity: 0.5, duration: 18, ease: 'sine.inOut'
    }, 0);
  }

  applyDefaultTheme() {
    this.animateThemeChange({
      primary: [138, 43, 226],
      secondary: [255, 20, 147],
      accent: [0, 255, 255],
      highlight: [255, 255, 255],
      darkTone: [20, 20, 30]
    });
  }

  applyThemeFromImage(imageUrl) {
    if (!this.colorThief) {
       this.applyDefaultTheme();
       return;
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    
    img.onload = () => {
      try {
        const palette = this.colorThief.getPalette(img, 6);
        if (palette && palette.length >= 3) {
          const balanced = this.balancePalette(palette);
          this.animateThemeChange(balanced);
        } else {
          this.applyDefaultTheme();
        }
      } catch (e) {
        console.warn("ThemeEngine: Failed to extract colors.", e);
        this.applyDefaultTheme();
      }
    };
    
    img.onerror = () => this.applyDefaultTheme();
    img.src = imageUrl;
  }

  getLuminance([r, g, b]) {
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  balancePalette(palette) {
    // Sort by luminance
    const sorted = [...palette].sort((a, b) => this.getLuminance(b) - this.getLuminance(a));
    
    // Lightest for highlight
    const highlight = sorted[0];
    // Darkest for darkTone
    const darkTone = sorted[sorted.length - 1];
    
    // Remove highlight and darkTone from candidates for primary/secondary
    const midTones = sorted.slice(1, sorted.length - 1);
    
    // Pick primary as the first midtone, secondary as the second
    const primary = midTones.length > 0 ? midTones[0] : palette[0];
    const secondary = midTones.length > 1 ? midTones[1] : palette[1];
    const accent = midTones.length > 2 ? midTones[2] : highlight;
    
    return { primary, secondary, accent, highlight, darkTone };
  }

  animateThemeChange(colors) {
    const { primary, secondary, accent, highlight, darkTone } = colors;
    
    const rgb = (arr) => `rgb(${arr[0]}, ${arr[1]}, ${arr[2]})`;
    const rgba = (arr, alpha) => `rgba(${arr[0]}, ${arr[1]}, ${arr[2]}, ${alpha})`;
    
    const hex2rgb = (hex) => {
      const v = parseInt(hex.replace('#', ''), 16);
      return [v >> 16, (v >> 8) & 255, v & 255];
    };
    
    // Parse bg if provided (for presets), otherwise keep dynamic dark tone
    const bgColor = colors.bgBase ? colors.bgBase : [15, 15, 25];
    
    const shadowColorDark = [Math.max(0, bgColor[0]-15), Math.max(0, bgColor[1]-15), Math.max(0, bgColor[2]-15)];
    const shadowColorLight = [Math.min(255, bgColor[0]+15), Math.min(255, bgColor[1]+15), Math.min(255, bgColor[2]+15)];
    
    // Smooth, cinematic transition of CSS variables
    gsap.to(this.root, {
      '--color-primary': rgb(primary),
      '--color-secondary': rgb(secondary),
      '--color-accent': rgb(accent),
      '--color-highlight': rgb(highlight),
      '--color-dark-tone': rgb(darkTone),
      '--color-ambient-1': rgba(primary, 0.4),
      '--color-ambient-2': rgba(secondary, 0.3),
      '--color-bg-base': rgb(bgColor),
      '--clay-shadow-outset': `9px 9px 16px ${rgba(shadowColorDark, 0.6)}, -9px -9px 16px ${rgba(shadowColorLight, 0.4)}`,
      '--clay-shadow-inset': `inset 6px 6px 10px 0 ${rgba(shadowColorDark, 0.6)}, inset -6px -6px 10px 0 ${rgba(shadowColorLight, 0.4)}`,
      '--clay-shadow-hover': `12px 12px 20px ${rgba(shadowColorDark, 0.7)}, -12px -12px 20px ${rgba(shadowColorLight, 0.5)}`,
      '--clay-shadow-active': `inset 4px 4px 8px ${rgba(shadowColorDark, 0.6)}, inset -4px -4px 8px ${rgba(shadowColorLight, 0.4)}`,
      duration: 3, 
      ease: "power2.inOut",
      overwrite: "auto"
    });
    
    // Sync Visualizer Engine directly with the new secondary/accent color
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
       // do nothing or use a subtle color
       visualizerEngine.setColor(rgba(primary, 0.8));
    } else {
       visualizerEngine.setColor(rgba(secondary, 0.9));
    }
  }

  applyThemePreset(preset) {
    this.currentMode = preset;
    if (preset === 'dynamic') {
       // We can't re-extract immediately without the image, so we wait for QueueManager to do it
       return; 
    }

    const presets = {
      neon: { primary: [0, 255, 255], secondary: [255, 0, 255], accent: [255, 255, 0], highlight: [255, 255, 255], darkTone: [10, 10, 20], bgBase: [15, 10, 30] },
      sunset: { primary: [255, 94, 77], secondary: [255, 154, 68], accent: [255, 204, 0], highlight: [255, 255, 255], darkTone: [30, 15, 10], bgBase: [40, 20, 15] },
      ocean: { primary: [0, 119, 190], secondary: [0, 191, 255], accent: [64, 224, 208], highlight: [255, 255, 255], darkTone: [5, 15, 30], bgBase: [10, 25, 45] },
      forest: { primary: [34, 139, 34], secondary: [46, 139, 87], accent: [154, 205, 50], highlight: [255, 255, 255], darkTone: [10, 25, 10], bgBase: [15, 35, 20] },
      monochrome: { primary: [120, 120, 120], secondary: [160, 160, 160], accent: [200, 200, 200], highlight: [255, 255, 255], darkTone: [20, 20, 20], bgBase: [25, 25, 25] }
    };

    if (presets[preset]) {
      this.animateThemeChange(presets[preset]);
    }
  }
}

export const themeEngine = new ThemeEngine();
