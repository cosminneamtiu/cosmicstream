# CosmicStream for Movian (M7 / PS3)

**CosmicStream** is a universal multimedia search and streaming plugin for **Movian Media Center** (specifically tuned and tested for **M7 Movian on PlayStation 3**).

It brings TMDB-powered browsing (trending movies, popular TV shows, seasons & episodes) together with multiple streaming and torrent backends, subtitle support, and watch history with resume functionality.

---

## Features

- **TMDB Integration**: Browse Trending Shows, Trending Movies, Seasons, and Episodes with high-resolution posters and backdrops.
- **Recommendations**: Dynamic recommendations on the home screen based on what you recently watched.
- **Multiple Providers / Addons**:
  - **Torrentio**: Aggregated multi-source torrent streams with dedicated PS3 compatibility filtering (H.264/AAC prioritization).
  - **The Pirate Bay (TPB)**: Direct torrent search and playback.
  - **Nyaa & NekoBT**: Dedicated anime sources.
  - **Shana Project**: Anime episode tracking and streams.
- **Continue Watching & Watch History**: Keep track of last-watched titles and resume directly.
- **Built for PS3**: Lightweight JavaScript engine compatible with Movian's Duktape/Showtime ECMAScript environment.

---

## Installation on M7 Movian (PS3)

You can install CosmicStream on your PS3 running M7 Movian using any of the following methods:

### Method 1: Direct USB Installation (Recommended)

1. **Package the plugin as a ZIP archive**:
   Zip all files so that `plugin.json` is located in the **root** of the archive (do not enclose them inside a subfolder):
   ```bash
   zip -r cosmicstream.zip plugin.json main.js metadata.js history.js addons/ img/
   ```
2. **Copy to USB**:
   - Copy `cosmicstream.zip` to a FAT32-formatted USB flash drive.
3. **Install in Movian**:
   - Insert the USB drive into your PS3.
   - Launch **Movian / M7** on your PS3.
   - Go to **Settings** (gear icon) -> **Plugins**.
   - Select **Install plugin from file / USB** (or navigate to your USB drive via Movian's file browser and select `cosmicstream.zip`).
   - Confirm installation and restart Movian if prompted.

---

### Method 2: Local Network / Web Server (Quick Install)

If your PS3 and PC are on the same local Wi-Fi or LAN network:

1. **Package and host the zip file**:
   ```bash
   zip -r cosmicstream.zip plugin.json main.js metadata.js history.js addons/ img/
   python3 -m http.server 8000
   ```
2. **Install from Movian browser**:
   - In Movian on the PS3, open the built-in search or enter URL address:
     `http://<YOUR_PC_IP>:8000/cosmicstream.zip`
   - Movian will recognize the zip as a plugin package and prompt to install it.

---

### Method 3: FTP / File Manager (Direct Copy to HDD)

1. Connect to your PS3 via FTP (using WebMAN, multiMAN, or Movian's FTP).
2. Navigate to the Movian plugin installation folder:
   - For standard Movian/Showtime:
     `/dev_hdd0/game/HTSS00003/USRDIR/settings/plugins/installed/`
     *(or under `/dev_hdd0/game/SHOWTIME3/USRDIR/settings/plugins/installed/` depending on your M7 Movian title ID)*
3. Create a folder named `cosmicstream/` and copy all plugin files into it:
   - `plugin.json`
   - `main.js`
   - `metadata.js`
   - `history.js`
   - `addons/`
   - `img/`
4. Reboot Movian on the PS3.

---

## Configuration & Settings

Once installed:
1. Go to **Settings** -> **CosmicStream** in Movian.
2. You can enable or disable individual source providers:
   - *Torrentio*
   - *The Pirate Bay*
   - *Nyaa*
   - *NekoBT*
   - *Shana Project*
3. **PS3 Compatibility Filter**: Keep `Torrentio — PS3-compatible streams only` enabled to filter out codecs unsupported by the PS3 hardware decoder (such as 10-bit HEVC/H.265 or 4K/AV1).

---

## Repository Structure

```text
├── addons/             # Source provider modules (Torrentio, TPB, Nyaa, etc.)
├── img/                # UI icons, logos, and background artwork
├── history.js          # Local watch history and resume manager
├── main.js             # Movian UI routes and playback controller
├── metadata.js         # TMDB API wrapper for movies, series & recommendations
└── plugin.json         # Movian plugin manifest definition
```

---

## License & Disclaimer

This project is intended for educational and personal media center use with Movian. Ensure you comply with local laws and regulations regarding media streaming in your region.
