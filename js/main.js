/**
 * Anamorphosis 3D Simulator - Main Application
 *
 * Orchestrates Three.js rendering, face tracking, and off-axis projection
 * to create a "window into virtual reality" illusion on a flat monitor.
 */

import * as THREE from 'three';
import { OffAxisProjection } from './projection.js';
import { FaceTracker, MouseTracker } from './faceTracker.js';
import {
    createCubesScene,
    createRoomScene,
    createPillarsScene,
    createTunnelScene,
} from './scenes.js';

// ============================================
// Application State
// ============================================

const state = {
    // Three.js core
    renderer: null,
    scene: null,
    camera: null,

    // Modules
    projection: null,
    faceTracker: null,
    mouseTracker: null,
    activeTracker: null, // whichever tracker is currently driving the view

    // Scene controller (returned by scene builders, has update() method)
    sceneController: null,

    // Current eye position in world space
    eyePosition: new THREE.Vector3(0, 0, 60),

    // Settings
    settings: {
        projectionMode: 'offaxis',  // 'offaxis' or 'standard'
        sensitivity: 1.0,
        showGrid: true,
        showAxes: false,
        showDebug: true,
        showFrustumVis: false,
        showWebcam: true,
        mouseFallback: true,
    },

    // Performance
    clock: new THREE.Clock(),
    frameCount: 0,
    lastFpsTime: 0,
    fps: 0,

    // Frustum visualization
    frustumHelper: null,
};

// ============================================
// Initialization
// ============================================

async function init() {
    updateLoading(10, 'Initializing renderer...');

    // Create renderer
    state.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
    });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    state.renderer.shadowMap.enabled = true;
    state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    state.renderer.toneMappingExposure = 1.0;
    state.renderer.outputColorSpace = THREE.SRGBColorSpace;

    document.getElementById('canvas-container').appendChild(state.renderer.domElement);

    updateLoading(25, 'Creating scene...');

    // Create scene
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x0a0a15);
    state.scene.fog = new THREE.Fog(0x0a0a15, 80, 200);

    // Create camera (we'll override projection matrix manually)
    state.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
    state.camera.position.set(0, 0, 60);

    updateLoading(40, 'Setting up projection...');

    // Initialize off-axis projection
    state.projection = new OffAxisProjection();

    updateLoading(50, 'Loading default scene...');

    // Load default scene
    state.sceneController = createCubesScene(state.scene);

    updateLoading(65, 'Initializing face tracker...');

    // Initialize face tracker
    state.faceTracker = new FaceTracker();

    // Initialize in background - don't block on it
    state.faceTracker.init().then(success => {
        if (success) {
            console.log('Face tracker ready');
        }
    });

    // Set up mouse fallback
    state.mouseTracker = new MouseTracker();
    state.mouseTracker.onTrack = (x, y, z) => {
        if (state.activeTracker === state.mouseTracker) {
            handleTrackingUpdate(x, y, z);
        }
    };

    // Start mouse tracker by default
    if (state.settings.mouseFallback) {
        state.mouseTracker.start();
        state.activeTracker = state.mouseTracker;
    }

    updateLoading(80, 'Setting up UI...');

    // Set up UI
    setupUI();

    updateLoading(95, 'Starting render loop...');

    // Handle resize
    window.addEventListener('resize', onResize);

    // Start render loop
    animate();

    // Hide loading screen
    updateLoading(100, 'Ready!');
    setTimeout(() => {
        const ls = document.getElementById('loading-screen');
        ls.classList.add('fade-out');
        setTimeout(() => ls.remove(), 600);
    }, 300);
}

// ============================================
// Loading Screen
// ============================================

function updateLoading(percent, status) {
    const bar = document.getElementById('loading-bar');
    const text = document.getElementById('loading-status');
    if (bar) bar.style.width = `${percent}%`;
    if (text) text.textContent = status;
}

// ============================================
// Tracking Update Handler
// ============================================

function handleTrackingUpdate(normX, normY, distZ) {
    // Convert normalized tracking coords to eye position in world space
    state.eyePosition = state.projection.faceToEyePosition(
        normX, normY, distZ, state.settings.sensitivity
    );
}

// ============================================
// Render Loop
// ============================================

function animate() {
    requestAnimationFrame(animate);

    const time = state.clock.getElapsedTime();
    const delta = state.clock.getDelta();

    // Update scene animations
    if (state.sceneController && state.sceneController.update) {
        state.sceneController.update(time);
    }

    // Apply projection
    if (state.settings.projectionMode === 'offaxis') {
        state.projection.apply(state.eyePosition, state.camera);
    } else {
        // Standard perspective - just look at origin
        state.camera.position.copy(state.eyePosition);
        state.camera.lookAt(0, 0, 0);
        state.camera.updateProjectionMatrix();
    }

    // Render
    state.renderer.render(state.scene, state.camera);

    // Update FPS counter
    state.frameCount++;
    const now = performance.now();
    if (now - state.lastFpsTime > 500) {
        state.fps = Math.round((state.frameCount * 1000) / (now - state.lastFpsTime));
        state.frameCount = 0;
        state.lastFpsTime = now;
        updateDebugDisplay();
    }
}

// ============================================
// Debug Display
// ============================================

function updateDebugDisplay() {
    if (!state.settings.showDebug) return;

    const ep = state.eyePosition;
    document.getElementById('debug-fps').textContent = `FPS: ${state.fps}`;
    document.getElementById('debug-head-pos').textContent =
        `Head: x=${ep.x.toFixed(1)}, y=${ep.y.toFixed(1)}, z=${ep.z.toFixed(1)}`;

    const tracker = state.activeTracker;
    const latency = tracker ? (tracker.detectionLatency || 0).toFixed(1) : '--';
    document.getElementById('debug-latency').textContent = `Latency: ${latency} ms`;

    if (state.settings.projectionMode === 'offaxis') {
        const info = state.projection.getFrustumInfo(ep);
        if (info) {
            document.getElementById('debug-frustum').textContent =
                `Frustum: L=${info.left} R=${info.right} B=${info.bottom} T=${info.top}`;
        }
    } else {
        document.getElementById('debug-frustum').textContent = 'Frustum: standard (symmetric)';
    }
}

// ============================================
// UI Setup
// ============================================

function setupUI() {
    // Controls panel toggle
    const toggle = document.getElementById('controls-toggle');
    const content = document.getElementById('controls-content');
    toggle.addEventListener('click', () => {
        content.classList.toggle('open');
    });

    // Scene selection
    document.getElementById('scene-select').addEventListener('change', (e) => {
        switch (e.target.value) {
            case 'cubes': state.sceneController = createCubesScene(state.scene); break;
            case 'room': state.sceneController = createRoomScene(state.scene); break;
            case 'pillars': state.sceneController = createPillarsScene(state.scene); break;
            case 'tunnel': state.sceneController = createTunnelScene(state.scene); break;
        }
        applyGridAxesSettings();
    });

    // Grid toggle
    document.getElementById('show-grid').addEventListener('change', (e) => {
        state.settings.showGrid = e.target.checked;
        applyGridAxesSettings();
    });

    // Axes toggle
    document.getElementById('show-axes').addEventListener('change', (e) => {
        state.settings.showAxes = e.target.checked;
        applyGridAxesSettings();
    });

    // Screen calibration
    document.getElementById('screen-width').addEventListener('change', (e) => {
        state.projection.setScreenSize(parseFloat(e.target.value), state.projection.screenHeight);
    });
    document.getElementById('screen-height').addEventListener('change', (e) => {
        state.projection.setScreenSize(state.projection.screenWidth, parseFloat(e.target.value));
    });
    document.getElementById('cam-offset-x').addEventListener('change', (e) => {
        state.projection.setCamOffset(parseFloat(e.target.value), state.projection.camOffsetY);
    });
    document.getElementById('cam-offset-y').addEventListener('change', (e) => {
        state.projection.setCamOffset(state.projection.camOffsetX, parseFloat(e.target.value));
    });

    // Smoothing
    const smoothSlider = document.getElementById('smoothing');
    const smoothVal = document.getElementById('smoothing-val');
    smoothSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        smoothVal.textContent = val.toFixed(2);
        if (state.faceTracker) state.faceTracker.setSmoothing(val);
        if (state.mouseTracker) state.mouseTracker.setSmoothing(val);
    });

    // Sensitivity
    const sensSlider = document.getElementById('sensitivity');
    const sensVal = document.getElementById('sensitivity-val');
    sensSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        sensVal.textContent = val.toFixed(1);
        state.settings.sensitivity = val;
    });

    // Mouse fallback
    document.getElementById('mouse-fallback').addEventListener('change', (e) => {
        state.settings.mouseFallback = e.target.checked;
        if (e.target.checked && state.activeTracker !== state.faceTracker) {
            state.mouseTracker.start();
            state.activeTracker = state.mouseTracker;
        }
    });

    // Show webcam preview
    document.getElementById('show-webcam').addEventListener('change', (e) => {
        state.settings.showWebcam = e.target.checked;
        document.getElementById('webcam-preview').classList.toggle('hidden', !e.target.checked);
    });

    // Projection mode
    document.getElementById('projection-mode').addEventListener('change', (e) => {
        state.settings.projectionMode = e.target.value;
    });

    // Clip planes
    document.getElementById('near-plane').addEventListener('change', (e) => {
        state.projection.setClipPlanes(parseFloat(e.target.value), state.projection.far);
    });
    document.getElementById('far-plane').addEventListener('change', (e) => {
        state.projection.setClipPlanes(state.projection.near, parseFloat(e.target.value));
    });

    // Debug toggle
    document.getElementById('show-debug').addEventListener('change', (e) => {
        state.settings.showDebug = e.target.checked;
        document.getElementById('debug-overlay').classList.toggle('hidden', !e.target.checked);
    });

    // Frustum visualization
    document.getElementById('show-frustum-vis').addEventListener('change', (e) => {
        state.settings.showFrustumVis = e.target.checked;
        // This would add a CameraHelper - for simplicity, just toggle
        if (e.target.checked) {
            if (!state.frustumHelper) {
                state.frustumHelper = new THREE.CameraHelper(state.camera);
                state.frustumHelper.name = 'frustumHelper';
            }
            state.scene.add(state.frustumHelper);
        } else if (state.frustumHelper) {
            state.scene.remove(state.frustumHelper);
        }
    });

    // Start face tracking button
    document.getElementById('btn-start-tracking').addEventListener('click', async () => {
        const btn = document.getElementById('btn-start-tracking');

        if (state.faceTracker.isRunning) {
            // Stop face tracking
            state.faceTracker.stop();
            btn.textContent = 'Start Face Tracking';

            // Fall back to mouse
            if (state.settings.mouseFallback) {
                state.mouseTracker.start();
                state.activeTracker = state.mouseTracker;
            }
        } else {
            btn.textContent = 'Starting...';
            btn.disabled = true;

            // Ensure tracker is initialized
            if (!state.faceTracker.isReady) {
                await state.faceTracker.init();
            }

            // Set up tracking callback
            state.faceTracker.onTrack = (x, y, z) => {
                handleTrackingUpdate(x, y, z);
            };

            const started = await state.faceTracker.start();
            btn.disabled = false;

            if (started) {
                // Stop mouse tracker
                state.mouseTracker.stop();
                state.activeTracker = state.faceTracker;
                btn.textContent = 'Stop Face Tracking';
            } else {
                btn.textContent = 'Start Face Tracking';
                // Keep mouse fallback
                if (state.settings.mouseFallback && !state.mouseTracker.isRunning) {
                    state.mouseTracker.start();
                    state.activeTracker = state.mouseTracker;
                }
            }
        }
    });

    // Reset button
    document.getElementById('btn-reset').addEventListener('click', () => {
        state.eyePosition.set(0, 0, 60);
        state.camera.position.set(0, 0, 60);
        state.camera.lookAt(0, 0, 0);
    });
}

// ============================================
// Grid / Axes Helpers
// ============================================

function applyGridAxesSettings() {
    state.scene.traverse(child => {
        if (child.name === 'grid') {
            child.visible = state.settings.showGrid;
        }
    });

    // Remove existing axes helper
    const existingAxes = state.scene.getObjectByName('axesHelper');
    if (existingAxes) state.scene.remove(existingAxes);

    if (state.settings.showAxes) {
        const axes = new THREE.AxesHelper(20);
        axes.name = 'axesHelper';
        state.scene.add(axes);
    }
}

// ============================================
// Window Resize
// ============================================

function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    state.renderer.setSize(w, h);
    state.camera.aspect = w / h;

    // Only update projection matrix if using standard mode
    if (state.settings.projectionMode === 'standard') {
        state.camera.updateProjectionMatrix();
    }
}

// ============================================
// Start
// ============================================

init().catch(err => {
    console.error('App init error:', err);
    updateLoading(0, `Error: ${err.message}`);
});
