# Persona Non Grata

can you build games?

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://persona-non-grata.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4cba99fb-c876-4a29-97be-e6af48acbfcf).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

### Musik-Loops erzeugen

Mit Node.js und den installierten Projektabhängigkeiten:

```sh
node scripts/make-track.mjs --style ambient --seed 1
node scripts/make-track.mjs --style pop --seed 1
node scripts/make-track.mjs --style pop --seed 2 --name pop-2
ffmpeg -i src/assets/audio/06-pop-2.wav -codec:a libmp3lame -b:a 192k src/assets/audio/06-pop-2.mp3
```

Der Generator schreibt MIDI und 48-kHz-Stereo-WAV nach `src/assets/audio/06-<name>.*`; ohne `--name` dient der Stil als Name. Ein erneuter Aufruf überschreibt die Dateien. `--seed` ist eine ganze Zahl (Standard: 1); gleiche Eingaben erzeugen gleiche Ergebnisse. Ambient läuft mit 80 BPM in D-Dorisch, Pop mit 108 BPM in G-Dur. Beide haben 40 Takte (2:00 bzw. 1:28,889). Die Offline-Synthese normalisiert auf ungefähr −16 LUFS und blendet die Enden kurz aus. Die MP3-Konvertierung benötigt FFmpeg; MP3-Encoder und Browser können den Loop-Übergang unterschiedlich behandeln. Die MP3s sind vorbereitet, aber keiner Spielsituation zugeordnet.
