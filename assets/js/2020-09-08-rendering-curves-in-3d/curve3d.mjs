import Vec3 from '/assets/js/vec3.mjs';
import BezierCurve from '/assets/js/curve-optimization/bezier.mjs';

import {
  threeJSGeometryFromCurve,
  RotationMinimizingFrames
} from '/assets/js/curve-optimization/curve-geometry.mjs';

import { ModelViewerApp } from '/assets/js/3d-render.mjs';

const curve = new BezierCurve(
  [
    new Vec3(-1.2, -0.15, 0),
    new Vec3(-1.0,  1.25, 0),
    new Vec3( 1.0, -1.75, 0),
    new Vec3( 1.2,  0.55, 0),
  ],
  40
);

/**
 * Construct a new three.js geometry from the curve, given a function to
 * determine the frame at for any given sampled point. Then, render that
 * geometry onto the given canvas.
 */
const renderCurve = (canvas, frameAtIndex) =>
  new ModelViewerApp(canvas)
    .customizeScene((scene, camera) => { camera.position.z = 2; })
    .addGeometry(threeJSGeometryFromCurve(curve, frameAtIndex))
    .render();

/**
 * Render the Frenet-Serret frame visualization into the given canvas.
 */
export function renderAppWithFrenetSerretFrame(canvas) {
  const frameAtIndex = i => {
    const {
      t: forward,
      n: reference,
      b: upward
    } = curve.frenetSerretFrameAtIndex(i);

    return { f: forward, r: reference, u: upward };
  };

  renderCurve(canvas, frameAtIndex);
}

/**
 * Render the Rotation Minimizing Frame visualization into the given canvas.
 */
export function renderAppWithRotationMinimizingFrame(canvas) {
  const rmfs = new RotationMinimizingFrames(curve);
  const frameAtIndex = i => {
    const {
      t: forward,
      r: reference,
      s: upward
    } = rmfs.frames[i];

    return { f: forward, r: reference, u: upward };
  };

  renderCurve(canvas, frameAtIndex);
}
