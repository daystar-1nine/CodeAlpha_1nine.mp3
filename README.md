# 1nine.mp3 🎧

1nine.mp3 is a premium, audiophile-grade local web music player. Designed with a stunning, modern glassmorphism UI, it provides deep audio processing capabilities right in your browser. 

Say goodbye to flat music and hello to a fully customizable listening experience with a built-in 10-band equalizer, crossfading, concert hall reverb, and dynamic visualizers that respond to your music in real-time.

---

## ✨ Key Features

### 🎛️ Advanced Audio Processing
Built directly on top of the Web Audio API to give you complete control over your sound.
- **10-Band Equalizer**: Fine-tune frequencies from 32Hz all the way up to 16kHz.
- **Curated EQ Presets**: Easily switch between Flat, Bass Boost, Electronic, Acoustic, Classical, Rock, and Pop.
- **Concert Hall Reverb**: Add depth and spatial resonance to any track with customizable reverb levels.
- **Crossfader**: Seamless, DJ-style overlapping transitions between songs.
- **Playback Speed & Pitch**: Adjust your listening speed or pitch-shift your tracks on the fly.

### 🎨 Stunning Visuals & UI
- **Dynamic Theme Engine**: Automatically extracts colors from the current album art and applies a smooth, breathing ambient background gradient to the entire app.
- **Glassmorphism & Claymorphism**: A state-of-the-art interface utilizing soft UI shadows, frosted glass cards, and smooth micro-interactions (powered by GSAP).
- **Responsive Layout**: A beautiful collapsible sidebar allows you to maximize your screen real-estate to focus on the music.
- **Real-time Audio Visualizer**: A gorgeous canvas-based visualizer that pulses around the spinning vinyl record in perfect sync with the frequency data.

### 📚 Library & Organization
- **Local File Support**: Import folders of `.mp3`, `.flac`, `.wav`, and `.m4a` files directly from your computer (using the modern File System Access API).
- **ID3 Metadata Parsing**: Automatically extracts album art, track names, and artist info using jsmediatags.
- **IndexedDB Storage**: Your entire library, including extracted album art and metadata, is saved locally in your browser for instant loading the next time you open the app.
- **Smart Playlists**: Instantly view your "Most Played" and "Recently Added" tracks.
- **Global Search**: Instantly filter your entire library to find the exact track you want.

---

## 🚀 Getting Started

### Prerequisites
You will need [Node.js](https://nodejs.org/) installed on your machine to run the development server.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/daystar-1nine/CodeAlpha_1nine.mp3.git
   cd CodeAlpha_1nine.mp3
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to the local URL provided by Vite (usually `http://localhost:5173`).

---

## 🛠️ Tech Stack

- **HTML5 & CSS3**: Custom-built variables, CSS grid/flexbox, and advanced backdrop-filters.
- **Vanilla JavaScript (ES6+)**: Modular, class-based engine architecture for maximum performance without bloated frameworks.
- **Web Audio API**: For routing, BiquadFilterNodes (EQ), ConvolverNodes (Reverb), and AnalyserNodes (Visualizer).
- **IndexedDB**: For fast, persistent client-side storage of large audio metadata.
- **Vite**: Blazing fast frontend build tooling.
- **GSAP**: For complex, buttery-smooth cinematic animations and transitions.
- **jsmediatags**: For parsing local MP3 ID3 tags.
- **ColorThief**: For extracting dominant color palettes from album art.
- **Lucide Icons**: For sharp, modern iconography.

---

## 👨‍💻 Architecture & Engines

1nine.mp3 is built using a decoupled engine architecture, making it highly maintainable and scalable:
- `AudioEngine.js`: Manages the Web Audio Graph and audio nodes.
- `ThemeEngine.js`: Handles color extraction and dynamic CSS variable animation.
- `VisualizerEngine.js`: Handles canvas drawing and frequency data rendering.
- `StorageEngine.js`: Manages IndexedDB for persistent library storage.
- `LibraryManager.js`: Handles sorting, searching, and metadata extraction pipelines.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
