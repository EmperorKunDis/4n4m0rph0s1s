/**
 * Off-Axis Projection Module
 *
 * Computes an asymmetric frustum (off-axis projection matrix) that treats
 * the monitor as a physical window into a virtual world. This is the core
 * math that makes the anamorphosis illusion work.
 *
 * Reference: Robert Kooima, "Generalized Perspective Projection"
 * http://csc.lsu.edu/~kooima/pdfs/gen-perspective.pdf
 */

import * as THREE from "three";

export class OffAxisProjection {
  constructor() {
    // Physical screen dimensions in cm
    this.screenWidth = 52;
    this.screenHeight = 32;

    // Webcam offset from screen center in cm (x, y)
    this.camOffsetX = 0;
    this.camOffsetY = 1.5;

    // Clipping planes
    this.near = 0.1;
    this.far = 500;

    // Screen corner positions in world space (cm)
    // Screen is centered at origin, lying on the Z=0 plane
    this._updateScreenCorners();

    // Temporary vectors for computation
    this._vr = new THREE.Vector3();
    this._vu = new THREE.Vector3();
    this._vn = new THREE.Vector3();
    this._va = new THREE.Vector3();
    this._vb = new THREE.Vector3();
    this._vc = new THREE.Vector3();
  }

  /**
   * Update screen physical dimensions
   */
  setScreenSize(widthCm, heightCm) {
    this.screenWidth = widthCm;
    this.screenHeight = heightCm;
    this._updateScreenCorners();
  }

  /**
   * Set camera offset (webcam position relative to screen center)
   */
  setCamOffset(x, y) {
    this.camOffsetX = x;
    this.camOffsetY = y;
  }

  /**
   * Set near/far clipping planes
   */
  setClipPlanes(near, far) {
    this.near = near;
    this.far = far;
  }

  /**
   * Recalculate screen corner positions.
   * Screen is on the XY plane at Z=0, centered at origin.
   *
   * pa = bottom-left corner
   * pb = bottom-right corner
   * pc = top-left corner
   */
  _updateScreenCorners() {
    const hw = this.screenWidth / 2;
    const hh = this.screenHeight / 2;

    this.pa = new THREE.Vector3(-hw, -hh, 0); // bottom-left
    this.pb = new THREE.Vector3(hw, -hh, 0); // bottom-right
    this.pc = new THREE.Vector3(-hw, hh, 0); // top-left
  }

  /**
   * Compute the off-axis projection matrix for a given eye position.
   *
   * This implements the generalized perspective projection algorithm.
   * The monitor acts as a "window" - the projection is computed so that
   * what's rendered corresponds to what you'd see through a physical
   * window from the eye's position.
   *
   * @param {THREE.Vector3} eyePos - Eye/head position in world space (cm)
   * @param {THREE.Camera} camera - Three.js camera to update
   */
  apply(eyePos, camera) {
    const pa = this.pa;
    const pb = this.pb;
    const pc = this.pc;
    const pe = eyePos;

    // Compute orthonormal basis for the screen
    // vr = right direction along screen
    this._vr.subVectors(pb, pa).normalize();
    // vu = up direction along screen
    this._vu.subVectors(pc, pa).normalize();
    // vn = normal to screen (pointing toward viewer)
    this._vn.crossVectors(this._vr, this._vu).normalize();

    // Compute vectors from eye to screen corners
    // va = vector from eye to bottom-left
    this._va.subVectors(pa, pe);
    // vb = vector from eye to bottom-right
    this._vb.subVectors(pb, pe);
    // vc = vector from eye to top-left
    this._vc.subVectors(pc, pe);

    // Distance from eye to screen plane
    const d = -this._va.dot(this._vn);

    // Prevent division by zero or negative distance
    if (d < 0.1) return;

    const nearOverD = this.near / d;

    // Compute frustum extents on the near plane
    const left = this._vr.dot(this._va) * nearOverD;
    const right = this._vr.dot(this._vb) * nearOverD;
    const bottom = this._vu.dot(this._va) * nearOverD;
    const top = this._vu.dot(this._vc) * nearOverD;

    // Set the asymmetric frustum projection matrix
    camera.projectionMatrix.makePerspective(
      left,
      right,
      bottom,
      top,
      this.near,
      this.far,
    );
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

    // Build rotation matrix to align camera with screen basis
    // The camera looks along -Z in its local space, so we need to
    // rotate it so that its local axes match the screen's basis
    const m = new THREE.Matrix4();
    const e = m.elements;
    e[0] = this._vr.x;
    e[4] = this._vr.y;
    e[8] = this._vr.z;
    e[12] = 0;
    e[1] = this._vu.x;
    e[5] = this._vu.y;
    e[9] = this._vu.z;
    e[13] = 0;
    e[2] = this._vn.x;
    e[6] = this._vn.y;
    e[10] = this._vn.z;
    e[14] = 0;
    e[3] = 0;
    e[7] = 0;
    e[11] = 0;
    e[15] = 1;

    // Position camera at eye location and orient toward screen
    camera.position.copy(pe);
    camera.quaternion.setFromRotationMatrix(m);

    // Manually update the matrix world
    camera.matrixWorldNeedsUpdate = true;
    camera.updateMatrixWorld(true);
  }

  /**
   * Convert tracked face position to eye position in world coordinates.
   *
   * Face tracker gives normalized coordinates:
   *   x: 0 (left of webcam) to 1 (right of webcam) -> mirrored
   *   y: 0 (top) to 1 (bottom)
   *   z: estimated distance in cm
   *
   * We need to convert these to world-space cm relative to screen center.
   *
   * @param {number} normX - Normalized X from face tracker (0-1, mirrored)
   * @param {number} normY - Normalized Y from face tracker (0-1)
   * @param {number} distZ - Estimated distance from screen in cm
   * @param {number} sensitivity - Movement sensitivity multiplier
   * @returns {THREE.Vector3} Eye position in world space
   */
  faceToEyePosition(normX, normY, distZ, sensitivity = 1.0) {
    // Map normalized coords to physical screen space
    // Webcam is NOT mirrored in raw video → negate X so moving right = positive X
    const x = -(normX - 0.5) * this.screenWidth * sensitivity + this.camOffsetX;
    const y =
      -(normY - 0.5) * this.screenHeight * sensitivity + this.camOffsetY;
    const z = Math.max(distZ, 10); // minimum 10cm distance

    return new THREE.Vector3(x, y, z);
  }

  /**
   * Get frustum info for debug display
   */
  getFrustumInfo(eyePos) {
    const d = eyePos.z;
    if (d < 0.1) return null;

    const nearOverD = this.near / d;
    this._va.subVectors(this.pa, eyePos);
    this._vb.subVectors(this.pb, eyePos);
    this._vc.subVectors(this.pc, eyePos);

    return {
      left: (this._vr.dot(this._va) * nearOverD).toFixed(3),
      right: (this._vr.dot(this._vb) * nearOverD).toFixed(3),
      bottom: (this._vu.dot(this._va) * nearOverD).toFixed(3),
      top: (this._vu.dot(this._vc) * nearOverD).toFixed(3),
      eyeDistance: d.toFixed(1),
    };
  }
}
