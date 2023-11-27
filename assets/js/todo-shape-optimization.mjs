import Vec3 from '/assets/js/vec3.mjs';
import ClosedBSpline from '/assets/js/curve-optimization/b-spline.mjs';
import SampledCurve from '/assets/js/curve-optimization/sampled-curve.mjs';

import {
  threeJSGeometryFromCurve,
  RmfsWithInterpolatedTwist,
  RotationMinimizingFrames,
  updateThreeJSGeometryFromCurve
} from '/assets/js/curve-optimization/curve-geometry.mjs';

import {
  GradientDescentOptimizer,
  ClosedCurveEnergy,
  ParameterDeltaToControlPointApplication
} from '/assets/js/curve-optimization/energy.mjs';

import { ModelViewerApp } from '/assets/js/3d-render.mjs';

const figureEightStartingUnsampledCurve = () => new ClosedBSpline(
  [
    new Vec3( 1.3333,  0.0000, 0),
    new Vec3( 1.2320,  0.5103, 0),
    new Vec3( 0.9427,  0.9427, 0),
    new Vec3( 0.5103,  1.2320, 0),
    new Vec3( 0.0000,  1.3333, 0),
    new Vec3(-0.5103,  1.2320, 0),
    new Vec3(-0.9427,  0.9427, 0),
    new Vec3(-1.2320,  0.5103, 0),
    new Vec3(-1.3333,  0.0000, 0),
    new Vec3(-1.2320, -0.5103, 0),
    new Vec3(-0.9427, -0.9427, 0),
    new Vec3(-0.5103, -1.2320, 0),
    new Vec3(-0.0000, -1.3333, 0),
    new Vec3( 0.5103, -1.2320, 0),
    new Vec3( 0.9427, -0.9427, 0),
    new Vec3( 1.2320, -0.5103, 0),
  ],
  3
);

/**
 * Render the automated figure-8 optimization.
 *
 * Additionally render the interactive form elements associated with the
 * visualization into the canvas' parent container. Assumes the parent
 * container is something like a `div` containing only the given canvas prior
 * to calling this function.
 */
export function renderAppWithOptimizingFigureEight(canvas) {
  const app = new ModelViewerApp(canvas);

  const unsampledCurve = figureEightStartingUnsampledCurve();
  const sampledCurve = new SampledCurve(unsampledCurve, 200);

  const rmfs = new RotationMinimizingFrames(sampledCurve);
  const twistedFrames = new RmfsWithInterpolatedTwist(rmfs, 20 * Math.PI);
  const frameAtIndex = i => twistedFrames.frames[i];

  const geometry =
    threeJSGeometryFromCurve(sampledCurve, frameAtIndex);

  const energy = new ClosedCurveEnergy(sampledCurve, 0.5);
  const optimizer = new GradientDescentOptimizer(
    unsampledCurve.numControlPoints * 3, // TODO: document
    0.1,
    0.00001,
    energy,
    new ParameterDeltaToControlPointApplication(unsampledCurve)
  );

  // TODO: make this a dynamic button that reflects the current state of the
  // optimization, and add some additional information about the optimization.
  const button = document.createElement('button');
  button.innerHTML = 'Optimize';
  canvas.parentNode.appendChild(button);

  button.addEventListener('click', () => {
    console.log('starting optimization...');
    console.log(unsampledCurve.controlPoints.map(p => `<${p.x}, ${p.y}, ${p.z}>`).join(', '));

    let i = 0;
    function iterate() {
      console.log('iterating optimization...');
      const done = optimizer.runStep();

      const sampledCurve = new SampledCurve(unsampledCurve, 200);
      const rmfs = new RotationMinimizingFrames(sampledCurve);
      const twistedFrames = new RmfsWithInterpolatedTwist(rmfs, 20 * Math.PI);
      const frameAtIndex = i => twistedFrames.frames[i];
      updateThreeJSGeometryFromCurve(geometry, sampledCurve, frameAtIndex);

      i++;
      if (!done && i < 100) { requestAnimationFrame(iterate); }
      else {
        console.log('Ending after', i, 'iterations');
        console.log(unsampledCurve.controlPoints.map(p => `<${p.x}, ${p.y}, ${p.z}>`).join(', '));
      }
    }

    requestAnimationFrame(iterate);
  });

  app
    .customizeScene((scene, camera) => { camera.position.z = 5; })
    .addGeometry(geometry)
    .render();
}
