import { audioEngine } from './AudioEngine.js';
import gsap from 'gsap';

export class VisualizerEngine {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.animationFrameId = null;
    this.mode = 'circular'; // 'circular', 'bars', 'waveform', etc.
    
    // Default visualizer colors (updated by ThemeEngine eventually)
    this.primaryColor = 'rgba(255, 255, 255, 0.8)';
  }

  init(canvasElementId) {
    this.canvas = document.getElementById(canvasElementId);
    if (!this.canvas) {
      console.warn(`VisualizerEngine: Canvas #${canvasElementId} not found`);
      return;
    }
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  start() {
    if (this.animationFrameId) return; // Already running
    this.loop();
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  setMode(mode) {
    this.mode = mode;
  }

  setColor(colorStr) {
    if (!this.currentColorObj) {
      this.currentColorObj = { color: this.primaryColor };
    }
    
    gsap.to(this.currentColorObj, {
      color: colorStr,
      duration: 3,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.primaryColor = this.currentColorObj.color;
      }
    });
  }

  loop() {
    if (!this.ctx || !this.canvas) return;
    
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Get frequency data
    const dataArray = audioEngine.getAnalyserData('frequency');
    
    if (dataArray) {
      if (this.mode === 'circular') {
        this.drawCircularSpectrum(dataArray);
      } else if (this.mode === 'bars') {
        this.drawSpectrumBars(dataArray);
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  drawCircularSpectrum(dataArray) {
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    
    // The radius should be slightly larger than the album art
    // We assume the album art takes up about 60% of the container
    const baseRadius = Math.min(cx, cy) * 0.71; 
    const barWidth = Math.max(2, Math.min(cx, cy) * 0.02);
    const maxBarHeight = Math.min(cx, cy) * 0.28;
    
    // Only use a subset of the frequencies (skip the highest ones which are often empty)
    const bufferLength = dataArray.length;
    const numBars = 120; 
    const step = Math.floor(bufferLength / numBars);
    
    this.ctx.beginPath();
    for (let i = 0; i < numBars; i++) {
      const dataIndex = i * step;
      // Normalizing the value
      const value = dataArray[dataIndex] / 255.0; 
      const barHeight = value * maxBarHeight;

      // Calculate angle
      const angle = (i * (Math.PI * 2)) / numBars;

      // Start and end points for the line
      const x1 = cx + Math.cos(angle) * baseRadius;
      const y1 = cy + Math.sin(angle) * baseRadius;
      const x2 = cx + Math.cos(angle) * (baseRadius + barHeight);
      const y2 = cy + Math.sin(angle) * (baseRadius + barHeight);

      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
    }
    this.ctx.lineWidth = barWidth;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = this.primaryColor;
    this.ctx.stroke();
  }

  drawSpectrumBars(dataArray) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    const bufferLength = dataArray.length;
    const numBars = 64;
    const barWidth = (width / numBars) - 2;
    const step = Math.floor(bufferLength / numBars);

    this.ctx.fillStyle = this.primaryColor;
    
    this.ctx.beginPath();
    for (let i = 0; i < numBars; i++) {
      const dataIndex = i * step;
      const value = dataArray[dataIndex] / 255.0;
      const barHeight = value * (height * 0.5);

      const x = i * (barWidth + 2);
      const y = height - barHeight;

      this.ctx.rect(x, y, barWidth, barHeight);
      
      // rounded corners top for bar
      this.ctx.arc(x + barWidth/2, y, barWidth/2, Math.PI, 0);
    }
    this.ctx.fill();
  }
}

export const visualizerEngine = new VisualizerEngine();
