# 4n4m0rph0s1s

**Anamorphosis illusion engine** — a browser-based depth illusion powered by real-time face tracking and off-axis 3D projection. No VR headset required.

> You're not building a website. You're building a window into virtual reality — without glasses.

---

## How It Works

For the anamorphosis (perspective distortion) to work dynamically and create a depth illusion during movement, the application is built on three key pillars: **3D rendering**, **webcam-based face tracking**, and **real-time perspective recalculation**.

### 1. 3D Rendering — Three.js

The foundation is [Three.js](https://threejs.org/), the standard library for 3D graphics on the web. It handles loading 3D models (ideally in glTF/GLB format, optimized for web) and camera manipulation.

For maximum visual fidelity, use **Three.js WebGPURenderer** (available since r148+) instead of the default WebGLRenderer — it offers 2–5× higher throughput on modern hardware and unlocks better post-processing (bloom, ambient occlusion) without expensive WebGL shader hacks.

### 2. Head Tracking — MediaPipe Tasks Vision API

For the illusion to work, the system needs to know where your eyes are relative to the monitor. Move left — the image "rotates" right so you can see "around the corner."

- **Recommended: `@mediapipe/tasks-vision` with `FaceLandmarker`** — WASM-accelerated, ~50% lower latency than TensorFlow.js, ~60% smaller bundle, 468 landmarks for accurate Z-depth estimation.
- **Avoid: TensorFlow.js Face Landmarks** — heavy initialization, large bundle, higher latency.
- **Position detection:** The algorithm locates the midpoint between your eyes and calculates its coordinates (X, Y) and approximate distance from the camera (Z).
- **No extra hardware:** No glasses, no IR diodes — just a standard webcam and a browser.

```js
// Preferred approach
import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
```

### 3. The Math — Asymmetric View Frustum (Off-Axis Projection)

This is the critical piece that separates a regular 3D scene from a true anamorphosis illusion.

A standard 3D game camera rotates around its axis. For this effect, you need **Off-Axis Projection** (aka "VR Window"):

- Think of the monitor as a **physical window**. When you approach it or move sideways, the window frame stays put — but what you see through it changes.
- In Three.js, you can't just rotate the camera. You must modify the **projection matrix**, creating an **asymmetric frustum** (a skewed viewing volume).
- When your head moves right, the virtual camera also shifts right, but its "lens" distorts (shifts) so the image on the monitor still matches the view from your new angle.

Use **Paul Bourke's off-axis projection formula** for geometrically accurate results:

```
left   = (L - eyeX) * near / eyeZ
right  = (R - eyeX) * near / eyeZ
top    = (T - eyeY) * near / eyeZ
bottom = (B - eyeY) * near / eyeZ
```

where `L, R, T, B` are the physical corners of the monitor in world-space coordinates.

---

## Architecture

### Thread Separation (Critical for Performance)

Face tracking **must run in a dedicated Web Worker** with `OffscreenCanvas` to avoid blocking the render loop:

```
Main thread  → Three.js render loop @ 60 fps
Worker thread → MediaPipe face detection @ 20–30 fps → postMessage(coords)
```

This is the single most effective fix for the "swimming" effect caused by frame drops during tracking.

### Coordinate Smoothing

Even with MediaPipe, raw tracking output jitters. Apply **Exponential Moving Average (EMA)** smoothing to the eye coordinates before feeding them to the projection matrix:

```js
smoothed.x = alpha * raw.x + (1 - alpha) * smoothed.x; // alpha ≈ 0.2–0.4
smoothed.y = alpha * raw.y + (1 - alpha) * smoothed.y;
smoothed.z = alpha * raw.z + (1 - alpha) * smoothed.z;
```

---

## Getting Started

### Prerequisites

- Modern browser with WebGL (ideally WebGPU) support
- Webcam access
- Decent lighting conditions

### Implementation Steps

1. **Face detection** — Webcam detects the face via MediaPipe Tasks Vision `FaceLandmarker`.
2. **Worker offload** — Run detection in a Web Worker; post smoothed eye coordinates to the main thread.
3. **Coordinate mapping** — Main thread converts face position to 3D world coordinates (x, y, z).
4. **Camera projection** — Manually set `projectionMatrix` in Three.js using Paul Bourke's formula, based on the viewer's head position relative to the physical monitor corners.

### Inspiration

The [trompeloeil](https://github.com/) project ("optical illusion" in French) solves exactly this problem — using face detection and adjusting the Three.js camera accordingly.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| 3D Engine | Three.js | Use `WebGPURenderer` for best performance |
| Face Tracking | MediaPipe Tasks Vision | `FaceLandmarker`, WASM-accelerated |
| Model Format | glTF / GLB | DRACO-compressed for fast load |
| Projection | Paul Bourke off-axis frustum | Geometrically accurate |
| Threading | Web Workers + OffscreenCanvas | Tracking isolated from render loop |
| Smoothing | Exponential Moving Average | Eliminates coordinate jitter |

---

## Known Challenges

**Latency** — The illusion must react to head movement nearly instantly. High latency causes image "swimming" and potential motion sickness. Mitigated by: MediaPipe over TF.js, Worker thread isolation, and EMA smoothing.

**Lighting** — Webcam-based face tracking depends on good lighting. Tracking may drop out in darkness or backlit conditions.

**Single-viewer experience** — The anamorphosis works correctly for only one viewer at a time. If multiple people look at the monitor from different angles, the illusion will appear distorted for everyone except the tracked viewer.

**Monitor calibration** — The off-axis formula requires knowing the physical dimensions and position of the monitor. Either hardcode typical values or provide a calibration step for the user.

---

## Performance Priorities

| Priority | Change | Impact |
|---|---|---|
| Critical | MediaPipe Tasks Vision instead of TF.js | −50% latency, −60% bundle size |
| Critical | Worker thread for face tracking | Eliminates "swimming" effect |
| Medium | EMA smoothing on coordinates | Stable illusion during slow movement |
| Medium | Paul Bourke off-axis formula | Geometrically accurate projection |
| Bonus | WebGPURenderer | Richer visuals, better post-processing |

---

## Summary

Use **Three.js (WebGPURenderer)** for the world, **MediaPipe Tasks Vision** for eye tracking in a dedicated **Web Worker**, **EMA smoothing** for stable coordinates, and **Paul Bourke's asymmetric projection matrix** (not just camera rotation) to create the depth effect.

---

## License

MIT
