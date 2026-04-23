/**
 * Face Tracking Module
 *
 * Uses MediaPipe Face Mesh via the Vision Tasks API to detect face landmarks
 * from the webcam feed. Extracts head position (X, Y) and estimates distance
 * (Z) based on inter-pupillary distance.
 */

export class FaceTracker {
    constructor() {
        this.video = document.getElementById('webcam');
        this.canvas = document.getElementById('webcam-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.statusEl = document.getElementById('tracking-status');

        // State
        this.isRunning = false;
        this.isReady = false;
        this.faceLandmarker = null;

        // Smoothed output
        this.smoothedX = 0.5;
        this.smoothedY = 0.5;
        this.smoothedZ = 60; // cm
        this.smoothing = 0.6;

        // Calibration: average inter-pupillary distance in cm
        this.avgIPD = 6.3;

        // Camera intrinsics estimate (will be updated from actual video)
        this.videoWidth = 640;
        this.videoHeight = 480;
        this.focalLengthPx = 640; // rough estimate for typical webcam

        // Callbacks
        this.onTrack = null;

        // Track last detection time for latency measurement
        this.lastDetectionTime = 0;
        this.detectionLatency = 0;
    }

    /**
     * Initialize MediaPipe Face Landmarker
     */
    async init() {
        this._setStatus('Loading MediaPipe...', '');

        try {
            // Dynamically import MediaPipe Vision module
            const vision = await this._loadMediaPipe();

            const { FaceLandmarker, FilesetResolver } = vision;

            const filesetResolver = await FilesetResolver.forVisionTasks(
                'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
            );

            this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                    delegate: 'GPU',
                },
                runningMode: 'VIDEO',
                numFaces: 1,
                minFaceDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            this.isReady = true;
            this._setStatus('Ready - click "Start Face Tracking"', '');
            return true;
        } catch (err) {
            console.error('FaceTracker init error:', err);
            this._setStatus(`Init error: ${err.message}`, 'error');
            return false;
        }
    }

    /**
     * Load MediaPipe dynamically
     */
    async _loadMediaPipe() {
        // Use dynamic import for the MediaPipe vision tasks
        const module = await import(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest'
        );
        return module;
    }

    /**
     * Start webcam and begin tracking
     */
    async start() {
        if (!this.isReady) {
            console.warn('FaceTracker not ready');
            return false;
        }

        try {
            this._setStatus('Requesting camera...', '');

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user',
                    frameRate: { ideal: 30 },
                },
            });

            this.video.srcObject = stream;
            await this.video.play();

            // Update dimensions from actual stream
            this.videoWidth = this.video.videoWidth;
            this.videoHeight = this.video.videoHeight;
            this.canvas.width = this.videoWidth;
            this.canvas.height = this.videoHeight;

            // Estimate focal length from video width (~typical webcam FOV of ~60deg)
            this.focalLengthPx = this.videoWidth / (2 * Math.tan((60 * Math.PI) / 180 / 2));

            this.isRunning = true;
            this._setStatus('Tracking active', 'active');
            this._detect();

            return true;
        } catch (err) {
            console.error('Camera error:', err);
            this._setStatus(`Camera error: ${err.message}`, 'error');
            return false;
        }
    }

    /**
     * Stop tracking
     */
    stop() {
        this.isRunning = false;
        if (this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(t => t.stop());
            this.video.srcObject = null;
        }
        this._setStatus('Stopped', '');
    }

    /**
     * Main detection loop
     */
    _detect() {
        if (!this.isRunning) return;

        const startTime = performance.now();

        if (this.video.readyState >= 2) {
            const results = this.faceLandmarker.detectForVideo(this.video, startTime);

            this.detectionLatency = performance.now() - startTime;

            if (results.faceLandmarks && results.faceLandmarks.length > 0) {
                this._processLandmarks(results.faceLandmarks[0]);
                this._drawPreview(results.faceLandmarks[0]);
            } else {
                this._drawPreview(null);
            }
        }

        requestAnimationFrame(() => this._detect());
    }

    /**
     * Process face landmarks to extract head position
     *
     * MediaPipe Face Mesh key landmarks:
     *   468 = left iris center (if available)
     *   473 = right iris center (if available)
     *   1   = nose tip (reliable center point)
     *   33  = left eye inner corner
     *   263 = right eye inner corner
     *   10  = forehead top
     *   152 = chin bottom
     */
    _processLandmarks(landmarks) {
        // Use eye corners for robust tracking
        const leftEye = landmarks[33];   // left eye inner corner
        const rightEye = landmarks[263]; // right eye inner corner
        const noseTip = landmarks[1];    // nose tip as center reference

        if (!leftEye || !rightEye || !noseTip) return;

        // Center point between eyes (normalized 0-1 coordinates)
        const centerX = (leftEye.x + rightEye.x) / 2;
        const centerY = (leftEye.y + rightEye.y) / 2;

        // Estimate distance from inter-pupillary distance
        // IPD in pixels: distance between eye corners in the image
        const ipdPixels = Math.sqrt(
            Math.pow((rightEye.x - leftEye.x) * this.videoWidth, 2) +
            Math.pow((rightEye.y - leftEye.y) * this.videoHeight, 2)
        );

        // Distance estimation using similar triangles:
        // realIPD / distance = pixelIPD / focalLength
        // distance = realIPD * focalLength / pixelIPD
        const estimatedZ = (this.avgIPD * this.focalLengthPx) / Math.max(ipdPixels, 10);

        // Apply smoothing (exponential moving average)
        const s = this.smoothing;
        this.smoothedX = this.smoothedX * s + centerX * (1 - s);
        this.smoothedY = this.smoothedY * s + centerY * (1 - s);
        this.smoothedZ = this.smoothedZ * s + estimatedZ * (1 - s);

        this.lastDetectionTime = performance.now();

        // Fire callback
        if (this.onTrack) {
            this.onTrack(this.smoothedX, this.smoothedY, this.smoothedZ);
        }
    }

    /**
     * Draw webcam preview with face landmarks overlay
     */
    _drawPreview(landmarks) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw video frame
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

        if (!landmarks) {
            // No face detected indicator
            this.ctx.fillStyle = 'rgba(255, 50, 50, 0.3)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }

        // Draw key landmarks
        const keyIndices = [1, 33, 263, 10, 152, 61, 291];
        this.ctx.fillStyle = '#00ff88';
        for (const idx of keyIndices) {
            const lm = landmarks[idx];
            if (!lm) continue;
            this.ctx.beginPath();
            this.ctx.arc(
                lm.x * this.canvas.width,
                lm.y * this.canvas.height,
                3, 0, Math.PI * 2
            );
            this.ctx.fill();
        }

        // Draw eye line
        const le = landmarks[33];
        const re = landmarks[263];
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(le.x * this.canvas.width, le.y * this.canvas.height);
        this.ctx.lineTo(re.x * this.canvas.width, re.y * this.canvas.height);
        this.ctx.stroke();

        // Draw center crosshair
        const cx = this.smoothedX * this.canvas.width;
        const cy = this.smoothedY * this.canvas.height;
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(cx - 10, cy);
        this.ctx.lineTo(cx + 10, cy);
        this.ctx.moveTo(cx, cy - 10);
        this.ctx.lineTo(cx, cy + 10);
        this.ctx.stroke();

        // Distance text
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`Z: ${this.smoothedZ.toFixed(1)} cm`, 10, 20);
    }

    /**
     * Set smoothing factor (0 = no smoothing, 0.95 = very smooth)
     */
    setSmoothing(value) {
        this.smoothing = Math.max(0, Math.min(0.95, value));
    }

    /**
     * Get current position data
     */
    getPosition() {
        return {
            x: this.smoothedX,
            y: this.smoothedY,
            z: this.smoothedZ,
            latency: this.detectionLatency,
        };
    }

    _setStatus(text, className) {
        this.statusEl.textContent = `Face tracking: ${text}`;
        this.statusEl.className = className || '';
    }
}

/**
 * Mouse-based head tracking fallback.
 * Maps mouse position to simulate head movement.
 */
export class MouseTracker {
    constructor() {
        this.x = 0.5;
        this.y = 0.5;
        this.z = 60;
        this.smoothing = 0.3;
        this.onTrack = null;

        this._rawX = 0.5;
        this._rawY = 0.5;

        this._onMouseMove = this._onMouseMove.bind(this);
        this._onWheel = this._onWheel.bind(this);
        this._animate = this._animate.bind(this);
        this.isRunning = false;
    }

    start() {
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('wheel', this._onWheel);
        this.isRunning = true;
        this._animate();

        const statusEl = document.getElementById('tracking-status');
        if (statusEl) {
            statusEl.textContent = 'Face tracking: Mouse fallback active';
            statusEl.className = 'active';
        }
    }

    stop() {
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('wheel', this._onWheel);
        this.isRunning = false;
    }

    _onMouseMove(e) {
        this._rawX = e.clientX / window.innerWidth;
        this._rawY = e.clientY / window.innerHeight;
    }

    _onWheel(e) {
        this.z = Math.max(20, Math.min(150, this.z + e.deltaY * 0.1));
    }

    _animate() {
        if (!this.isRunning) return;

        const s = this.smoothing;
        this.x = this.x * s + this._rawX * (1 - s);
        this.y = this.y * s + this._rawY * (1 - s);

        if (this.onTrack) {
            this.onTrack(this.x, this.y, this.z);
        }

        requestAnimationFrame(this._animate);
    }

    setSmoothing(value) {
        this.smoothing = Math.max(0, Math.min(0.95, value));
    }

    getPosition() {
        return { x: this.x, y: this.y, z: this.z, latency: 0 };
    }
}
