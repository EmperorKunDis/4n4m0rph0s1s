# 4n4m0rph0s1s

**Anamorphosis illusion engine** — a browser-based depth illusion powered by real-time face tracking and off-axis 3D projection. No VR headset required.

> You're not building a website. You're building a window into virtual reality — without glasses.

---

## How It Works

For the anamorphosis (perspective distortion) to work dynamically and create a depth illusion during movement, the application is built on three key pillars: **3D rendering**, **webcam-based face tracking**, and **real-time perspective recalculation**.

### 1. 3D Rendering — Three.js

The foundation is [Three.js](https://threejs.org/), the standard library for 3D graphics on the web. It handles loading 3D models (ideally in glTF/GLB format, optimized for web) and camera manipulation.

### 2. Head Tracking — TensorFlow.js / MediaPipe

For the illusion to work, the system needs to know where your eyes are relative to the monitor. Move left — the image "rotates" right so you can see "around the corner."

- **Webcam + AI:** Uses a webcam and a face recognition library such as [TensorFlow.js](https://www.tensorflow.org/js) (Face Landmarks Detection model) or [MediaPipe](https://mediapipe.dev/).
- **Position detection:** The algorithm locates the midpoint between your eyes and calculates its coordinates (X, Y) and approximate distance from the camera (Z).
- **No extra hardware:** No glasses, no IR diodes — just a standard webcam and a browser.

### 3. The Math — Asymmetric View Frustum (Off-Axis Projection)

This is the critical piece that separates a regular 3D scene from a true anamorphosis illusion.

A standard 3D game camera rotates around its axis. For this effect, you need **Off-Axis Projection** (aka "VR Window"):

- Think of the monitor as a **physical window**. When you approach it or move sideways, the window frame stays put — but what you see through it changes.
- In Three.js, you can't just rotate the camera. You must modify the **projection matrix**, creating an **asymmetric frustum** (a skewed viewing volume).
- When your head moves right, the virtual camera also shifts right, but its "lens" distorts (shifts) so the image on the monitor still matches the view from your new angle.

## Getting Started

### Prerequisites

- Modern browser with WebGL support
- Webcam access
- Decent lighting conditions

### Implementation Steps

1. **Face detection** — Webcam detects the face via TensorFlow.js / MediaPipe.
2. **Coordinate mapping** — Script converts face position to 3D space coordinates (x, y, z).
3. **Camera projection** — Instead of standard camera rotation, manually set `projectionMatrix` in Three.js based on the viewer's head position relative to monitor corners. Mathematically, you define the near plane boundaries based on the eye-to-screen-center distance.

### Inspiration

The [trompeloeil](https://github.com/) project ("optical illusion" in French) solves exactly this problem — using TensorFlow.js for face detection and adjusting the Three.js camera accordingly.

## Tech Stack

| Layer | Technology |
|---|---|
| 3D Engine | Three.js |
| Face Tracking | TensorFlow.js / MediaPipe |
| Model Format | glTF / GLB |
| Projection | Custom asymmetric frustum (off-axis) |
| Performance | WebGL, Web Workers |

## Known Challenges

**Latency** — The illusion must react to head movement nearly instantly. High latency causes image "swimming" and potential motion sickness. Performance optimization is critical (WebGL, Web Workers).

**Lighting** — Webcam-based face tracking depends on good lighting. Tracking may drop out in darkness or backlit conditions.

**Single-viewer experience** — The anamorphosis works correctly for only one viewer at a time. If multiple people look at the monitor from different angles, the illusion will appear distorted for everyone except the tracked viewer.

## Summary

Use **Three.js** for the world, **TensorFlow.js** for eye tracking, and an **asymmetric projection matrix** (not just camera rotation) to create the depth effect.

---

## License

MIT
