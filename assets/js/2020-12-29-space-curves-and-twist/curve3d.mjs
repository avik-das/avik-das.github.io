import Vec3 from '/assets/js/vec3.mjs';
import ClosedBSpline from '/assets/js/curve-optimization/b-spline.mjs';
import SampledCurve from '/assets/js/curve-optimization/sampled-curve.mjs';

import {
  threeJSGeometryFromCurve,
  updateThreeJSGeometryFromCurve,
  RmfsWithInterpolatedTwist,
  RotationMinimizingFrames
} from '/assets/js/curve-optimization/curve-geometry.mjs';

import { ModelViewerApp } from '/assets/js/3d-render.mjs';

const mismatchedEndsCurve = new SampledCurve(
  new ClosedBSpline(
    [
      new Vec3( 1, -1, -1),
      new Vec3( 1, -1, -1),
      new Vec3( 1,  1, -1),
      new Vec3( 1,  1, -1),
      new Vec3( 0,  1, -1),
      new Vec3( 0,  1, -1),
      new Vec3( 0, -1, -1),
      new Vec3( 0, -1, -1),
      new Vec3(-1, -1, -1),
      new Vec3(-1, -1, -1),
      new Vec3(-1,  1, -1),
      new Vec3(-1,  1, -1),
      new Vec3(-1,  1,  0),
      new Vec3(-1,  1,  0),
      new Vec3(-1, -1,  0),
      new Vec3(-1, -1,  0),
      new Vec3(-1, -1,  1),
      new Vec3(-1, -1,  1),
      new Vec3( 1, -1,  1),
      new Vec3( 1, -1,  1),
    ],
    3
  ),
  200
);

/**
 * A sequence of curves that, when rendered in order, form a crude animation
 * of a figure-8 unfolding. These points come from my simulation software,
 * which I used as the basis of my technical report, Bending and Torsion
 * Minimization of Toroidal Loops.
 *
 * In later articles, I recreate the simulation software to run in the browser,
 * but for this article, I'm hard-coding the positions so the user can see the
 * various intermediate states individually.
 *
 * https://www2.eecs.berkeley.edu/Pubs/TechRpts/2012/EECS-2012-165.html
 */
const animationFrameCurves = [
  {
    points: [
      [ 1.05,  2.22, -0.36],
      [ 3.36,  3.41, -0.08],
      [ 5.85,  2.46,  0.01],
      [ 6.86,  0.00,  0.00],
      [ 5.85, -2.46, -0.01],
      [ 3.36, -3.41,  0.08],
      [ 1.05, -2.22,  0.36],
      [ 0.00,  0.00,  0.55],
      [-1.05,  2.22,  0.36],
      [-3.36,  3.41,  0.08],
      [-5.85,  2.46, -0.01],
      [-6.86,  0.00,  0.00],
      [-5.85, -2.46,  0.01],
      [-3.36, -3.41, -0.08],
      [-1.05, -2.22, -0.36],
      [ 0.00,  0.00, -0.55],
    ],
    twistInDegrees: 30.88
  },
  {
    points: [
      [ 1.90,  1.80, -0.38],
      [ 4.32,  2.91, -0.31],
      [ 6.90,  2.43, -0.18],
      [ 8.21,  0.00,  0.00],
      [ 6.90, -2.43,  0.18],
      [ 4.32, -2.91,  0.31],
      [ 1.90, -1.80,  0.38],
      [ 0.00,  0.00,  0.43],
      [-1.90,  1.80,  0.38],
      [-4.32,  2.91,  0.31],
      [-6.90,  2.43,  0.18],
      [-8.21,  0.00,  0.00],
      [-6.90, -2.43, -0.18],
      [-4.32, -2.91, -0.31],
      [-1.90, -1.80, -0.38],
      [ 0.00,  0.00, -0.43],
    ],
    twistInDegrees: 28.33
  },
  {
    points: [
      [ 1.97,  1.72, -1.00],
      [ 4.41,  2.79, -0.93],
      [ 6.99,  2.34, -0.63],
      [ 8.31,  0.00,  0.00],
      [ 6.99, -2.34,  0.63],
      [ 4.41, -2.79,  0.93],
      [ 1.97, -1.72,  1.00],
      [ 0.00,  0.00,  1.00],
      [-1.97,  1.72,  1.00],
      [-4.41,  2.79,  0.93],
      [-6.99,  2.34,  0.63],
      [-8.31,  0.00,  0.00],
      [-6.99, -2.34, -0.63],
      [-4.41, -2.79, -0.93],
      [-1.97, -1.72, -1.00],
      [ 0.00,  0.00, -1.00],
    ],
    twistInDegrees: 78.39
  },
  {
    points: [
      [ 2.06,  1.60, -1.77],
      [ 4.51,  2.58, -1.63],
      [ 7.01,  2.15, -1.10],
      [ 8.31,  0.00,  0.00],
      [ 7.01, -2.15,  1.10],
      [ 4.51, -2.58,  1.63],
      [ 2.06, -1.60,  1.77],
      [ 0.00,  0.00,  1.77],
      [-2.06,  1.60,  1.77],
      [-4.51,  2.58,  1.63],
      [-7.01,  2.15,  1.10],
      [-8.31,  0.00,  0.00],
      [-7.01, -2.15, -1.10],
      [-4.51, -2.58, -1.63],
      [-2.06, -1.60, -1.77],
      [ 0.00,  0.00, -1.77],
    ],
    twistInDegrees: 138.53
  },
  {
    points: [
      [ 2.17,  1.44, -2.49],
      [ 4.63,  2.28, -2.27],
      [ 7.04,  1.87, -1.51],
      [ 8.29,  0.00,  0.00],
      [ 7.04, -1.87,  1.51],
      [ 4.63, -2.28,  2.27],
      [ 2.17, -1.44,  2.49],
      [ 0.00,  0.00,  2.51],
      [-2.17,  1.44,  2.49],
      [-4.63,  2.28,  2.27],
      [-7.04,  1.87,  1.51],
      [-8.29,  0.00,  0.00],
      [-7.04, -1.87, -1.51],
      [-4.63, -2.28, -2.27],
      [-2.17, -1.44, -2.49],
      [ 0.00,  0.00, -2.51],
    ],
    twistInDegrees: 194.15
  },
  {
    points: [
      [ 2.30,  1.22, -3.27],
      [ 4.75,  1.88, -2.91],
      [ 7.04,  1.51, -1.88],
      [ 8.14,  0.00,  0.00],
      [ 7.04, -1.51,  1.88],
      [ 4.75, -1.88,  2.91],
      [ 2.30, -1.22,  3.27],
      [ 0.00,  0.00,  3.34],
      [-2.30,  1.22,  3.27],
      [-4.75,  1.88,  2.91],
      [-7.04,  1.51,  1.88],
      [-8.14,  0.00,  0.00],
      [-7.04, -1.51, -1.88],
      [-4.75, -1.88, -2.91],
      [-2.30, -1.22, -3.27],
      [ 0.00,  0.00, -3.34],
    ],
    twistInDegrees: 249.91
  },
  {
    points: [
      [ 2.43,  0.92, -4.03],
      [ 4.86,  1.39, -3.47],
      [ 6.99,  1.08, -2.16],
      [ 7.94,  0.00,  0.00],
      [ 6.99, -1.08,  2.16],
      [ 4.86, -1.39,  3.47],
      [ 2.43, -0.92,  4.03],
      [ 0.00,  0.00,  4.17],
      [-2.43,  0.92,  4.03],
      [-4.86,  1.39,  3.47],
      [-6.99,  1.08,  2.16],
      [-7.94,  0.00,  0.00],
      [-6.99, -1.08, -2.16],
      [-4.86, -1.39, -3.47],
      [-2.43, -0.92, -4.03],
      [ 0.00,  0.00, -4.17],
    ],
    twistInDegrees: 297.97
  },
  {
    points: [
      [ 2.54,  0.52, -4.90],
      [ 4.89,  0.75, -4.02],
      [ 6.76,  0.56, -2.35],
      [ 7.52,  0.00,  0.00],
      [ 6.76, -0.56,  2.35],
      [ 4.89, -0.75,  4.02],
      [ 2.54, -0.52,  4.90],
      [ 0.00,  0.00,  5.17],
      [-2.54,  0.52,  4.90],
      [-4.89,  0.75,  4.02],
      [-6.76,  0.56,  2.35],
      [-7.52,  0.00,  0.00],
      [-6.76, -0.56, -2.35],
      [-4.89, -0.75, -4.02],
      [-2.54, -0.52, -4.90],
      [ 0.00,  0.00, -5.17],
    ],
    twistInDegrees: 339.73
  },
  {
    points: [
      [ 2.56,  0.16, -5.63],
      [ 4.89,  0.21, -4.37],
      [ 6.46,  0.15, -2.43],
      [ 7.05,  0.00,  0.00],
      [ 6.46, -0.15,  2.43],
      [ 4.89, -0.21,  4.37],
      [ 2.56, -0.16,  5.63],
      [ 0.00,  0.00,  6.03],
      [-2.56,  0.16,  5.63],
      [-4.89,  0.21,  4.37],
      [-6.46,  0.15,  2.43],
      [-7.05,  0.00,  0.00],
      [-6.46, -0.15, -2.43],
      [-4.89, -0.21, -4.37],
      [-2.56, -0.16, -5.63],
      [ 0.00,  0.00, -6.03],
    ],
    twistInDegrees: 357.53
  },
  {
    points: [
      [ 2.56,  0.09, -5.83],
      [ 4.82,  0.12, -4.47],
      [ 6.30,  0.09, -2.45],
      [ 6.85,  0.00,  0.00],
      [ 6.30, -0.09,  2.45],
      [ 4.82, -0.12,  4.47],
      [ 2.56, -0.09,  5.83],
      [ 0.00,  0.00,  6.28],
      [-2.56,  0.09,  5.83],
      [-4.82,  0.12,  4.47],
      [-6.30,  0.09,  2.45],
      [-6.85,  0.00,  0.00],
      [-6.30, -0.09, -2.45],
      [-4.82, -0.12, -4.47],
      [-2.56, -0.09, -5.83],
      [ 0.00,  0.00, -6.28],
    ],
    twistInDegrees: 359.21
  }
].map(specification => bSplineFromSpecification(specification));

/**
 * A set of curves demonstrating what curves look like when they have
 * additional twist added to them. These points come from the same simulation
 * software mentioned in the documentation for `animationFrameCurves`.
 *
 * Due to how the curves are switched out, namely by updating the positions of
 * a single mesh, it's important that all the curves have the same number of
 * sampled points.
 */
const additionalTwistCurves = [
  {
    points: [
      [ 4.000,  0.000, 0],
      [ 3.696,  1.531, 0],
      [ 2.828,  2.828, 0],
      [ 1.531,  3.696, 0],
      [ 0.000,  4.000, 0],
      [-1.531,  3.696, 0],
      [-2.828,  2.828, 0],
      [-3.696,  1.531, 0],
      [-4.000,  0.000, 0],
      [-3.696, -1.531, 0],
      [-2.828, -2.828, 0],
      [-1.531, -3.696, 0],
      [-0.000, -4.000, 0],
      [ 1.531, -3.696, 0],
      [ 2.828, -2.828, 0],
      [ 3.696, -1.531, 0],
    ],
    twistInDegrees: 0,
    metadata: { name: 'Planar circle, no additional twist' }
  },
  {
    points: [
      [ 0.586,  1.414, -0.2],
      [ 2.000,  2.000,  0.0],
      [ 3.414,  1.414,  0.0],
      [ 4.000,  0.000,  0.0],
      [ 3.414, -1.414,  0.0],
      [ 2.000, -2.000,  0.0],
      [ 0.568, -1.414,  0.2],
      [ 0.000,  0.000,  0.4],
      [-0.568,  1.414,  0.2],
      [-2.000,  2.000,  0.0],
      [-3.414,  1.414,  0.0],
      [-4.000,  0.000,  0.0],
      [-3.414, -1.414,  0.0],
      [-2.000, -2.000,  0.0],
      [-0.586, -1.414, -0.2],
      [ 0.000,  0.000, -0.4],
    ],
    // A little more than 360° of twist is needed because one arm of the
    // figure-8 is offset out of the plane.
    twistInDegrees: 395,
    metadata: { name: 'Figure-8, 360° twist' }
  },
  {
    points: [
      [ 4.000,  0.000, 0],
      [ 3.696,  1.531, 0],
      [ 2.828,  2.828, 0],
      [ 1.531,  3.696, 0],
      [ 0.000,  4.000, 0],
      [-1.531,  3.696, 0],
      [-2.828,  2.828, 0],
      [-3.696,  1.531, 0],
      [-4.000,  0.000, 0],
      [-3.696, -1.531, 0],
      [-2.828, -2.828, 0],
      [-1.531, -3.696, 0],
      [-0.000, -4.000, 0],
      [ 1.531, -3.696, 0],
      [ 2.828, -2.828, 0],
      [ 3.696, -1.531, 0],
    ],
    twistInDegrees: 720,
    metadata: { name: 'Planar circle, 720° twist' }
  },
  {
    points: [
      [ 4.000,  0.000, 0],
      [ 3.696,  1.531, 0],
      [ 2.828,  2.828, 0],
      [ 1.531,  3.696, 0],
      [ 0.000,  4.000, 0],
      [-1.531,  3.696, 0],
      [-2.828,  2.828, 0],
      [-3.696,  1.531, 0],
      [-4.000,  0.000, 0],
      [-3.696, -1.531, 0],
      [-2.828, -2.828, 0],
      [-1.531, -3.696, 0],
      [-0.000, -4.000, 0],
      [ 1.531, -3.696, 0],
      [ 2.828, -2.828, 0],
      [ 3.696, -1.531, 0],
    ],
    twistInDegrees: 3600,
    metadata: { name: 'Planar circle, 3600° twist' }
  },
].map(specification => bSplineFromSpecification(specification));

/**
 * Construct a B-Spline from the following "specification":
 *
 * - A list of points, each one a 3-element array of X, Y and Z coordinates.
 * - The additional twist to apply, in degrees.
 * - Any additional metadata that will get passed along as is.
 *
 * Returns a new object with the following pieces, ready for rendering:
 *
 * - The constructed B-Spline, after it's been sampled.
 * - The "frame at index" function needed for rendering.
 *   The original metadata, as is.
 */
function bSplineFromSpecification({ points, twistInDegrees, metadata }) {
  const curve = new SampledCurve(
    new ClosedBSpline(
      points.map(pt => new Vec3(...pt).div(3)),
      3
    ),
    200
  );

  const twist = twistInDegrees * Math.PI / 180;

  const rmfs = new RotationMinimizingFrames(curve);
  const twistedFrames = new RmfsWithInterpolatedTwist(rmfs, twist);

  const frameAtIndex = i => twistedFrames.frames[i];
  return { curve, frameAtIndex, metadata };
}

/**
 * Construct a new three.js geometry from the given curve, given a function to
 * determine the frame at for any given sampled point. Then, render that
 * geometry onto the given canvas.
 */
const renderCurve = (app, curveMesh) =>
  app
    .customizeScene((scene, camera) => { camera.position.z = 5; })
    .addMesh(curveMesh)
    .render();

/**
 * Construct the standard mesh for the mismatched ends curve, positioning and
 * rotating it so the build-in twist is visible in the default rendering.
 */
function meshForMismatchedEndsCurve(app, frameAtIndex) {
  const geometry = threeJSGeometryFromCurve(mismatchedEndsCurve, frameAtIndex);
  const mesh = app.standardMeshForGeometry(geometry);

  mesh.rotation.y = -Math.PI / 6;
  mesh.rotation.x =  Math.PI / 6;
  mesh.position.y = 0.25;

  return mesh;
}

/**
 * Render the mismatched ends visualization into the given canvas.
 */
export function renderAppWithMismatchedEnds(canvas) {
  const app = new ModelViewerApp(canvas);

  const rmfs = new RotationMinimizingFrames(mismatchedEndsCurve);
  const frameAtIndex = i => {
    const {
      t: forward,
      r: reference,
      s: upward
    } = rmfs.frames[i];

    return { f: forward, r: reference, u: upward };
  };

  renderCurve(app, meshForMismatchedEndsCurve(app, frameAtIndex));
}

/**
 * Render the mismatched ends visualization, with the mismatched ends
 * compensated for with a global twist, into the given canvas.
 */
export function renderAppWithCompensatingTwist(canvas) {
  const app = new ModelViewerApp(canvas);

  const rmfs = new RotationMinimizingFrames(mismatchedEndsCurve);
  const twistedFrames =
    new RmfsWithInterpolatedTwist(rmfs, rmfs.endToEndTwist);

  const frameAtIndex = i => twistedFrames.frames[i];
  renderCurve(app, meshForMismatchedEndsCurve(app, frameAtIndex));
}

/**
 * Render the unfolding figure-8 animation into the given canvas.
 *
 * Additionally render the interactive form elements associated with the
 * animation into the canvas' parent container. Assumes the parent container is
 * something like a `div` containing only the given canvas prior to calling
 * this function.
 */
export function renderAppWithUnfoldingFigureEight(canvas) {
  const frameIndexSlider = (() => {
    const form = document.createElement('form');

    const label = document.createElement('label');
    label.appendChild(document.createTextNode('Animation frame'));

    const slider = document.createElement('input');
    slider.id = 'figure-8-unfolding-slider';
    slider.type = 'range';
    slider.min = 0;
    slider.max = animationFrameCurves.length - 1;
    slider.value = 0;

    label.htmlFor = slider.id;

    form.appendChild(label);
    form.appendChild(slider);
    canvas.parentNode.appendChild(form);

    return slider;
  })();

  const app = new ModelViewerApp(canvas);

  const initialCurve = animationFrameCurves[0];
  const geometry =
    threeJSGeometryFromCurve(initialCurve.curve, initialCurve.frameAtIndex);
  const mesh = app.standardMeshForGeometry(geometry);

  mesh.rotation.y = -Math.PI / 6;
  mesh.rotation.x =  Math.PI / 6;
  mesh.position.x = -0.25;
  mesh.position.y = 0.25;
  mesh.position.z = 0.25;

  frameIndexSlider.addEventListener('input', evt => {
    const {
      curve,
      frameAtIndex
    } = animationFrameCurves[evt.target.valueAsNumber];
    updateThreeJSGeometryFromCurve(mesh.geometry, curve, frameAtIndex);
  });

  renderCurve(app, mesh);
}

/**
 * Render the additional twist visualization into the canvas.
 *
 * Additionally render the interactive form elements associated with the
 * visualization into the canvas' parent container. Assumes the parent
 * container is something like a `div` containing only the given canvas prior
 * to calling this function.
 */
export function renderAppWithAdditionalTwist(canvas) {
  const app = new ModelViewerApp(canvas);

  const form = document.createElement('form');
  canvas.parentNode.appendChild(form);

  const initialCurve = additionalTwistCurves[0];
  const geometry =
    threeJSGeometryFromCurve(initialCurve.curve, initialCurve.frameAtIndex);
  const mesh = app.standardMeshForGeometry(geometry);

  const radios = additionalTwistCurves
    .map(({ curve, frameAtIndex, metadata }, i) => {
      const label = document.createElement('label');
      label.appendChild(document.createTextNode(metadata.name));

      const radio = document.createElement('input');
      radio.id = 'additional-twist-curve';
      radio.name = 'additional-twist-curve';
      radio.type = 'radio';
      radio.value = i;
      radio.checked = i === 0;

      label.htmlFor = radio.id;

      radio.addEventListener('change', () => {
        updateThreeJSGeometryFromCurve(mesh.geometry, curve, frameAtIndex);
      });

      form.appendChild(label);
      form.appendChild(radio);

      return radio;
    });

  renderCurve(app, mesh);
}
