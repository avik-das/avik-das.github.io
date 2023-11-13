import Vec3 from '/assets/js/vec3.mjs';
import ClosedBSpline from '/assets/js/curve-optimization/b-spline.mjs';
import SampledCurve from '/assets/js/curve-optimization/sampled-curve.mjs';

import {
  threeJSGeometryFromCurve,
  RmfsWithInterpolatedTwist,
  RotationMinimizingFrames
} from '/assets/js/curve-optimization/curve-geometry.mjs';

import { ModelViewerApp } from '/assets/js/3d-render.mjs';

const figureEightStartingCurve = new SampledCurve(
  new ClosedBSpline(
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
  ),
  200
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

  // const form = document.createElement('form');
  // canvas.parentNode.appendChild(form);

  const rmfs = new RotationMinimizingFrames(figureEightStartingCurve);
  const twistedFrames = new RmfsWithInterpolatedTwist(rmfs, 20 * Math.PI);
  const frameAtIndex = i => twistedFrames.frames[i];

  const geometry =
    threeJSGeometryFromCurve(figureEightStartingCurve, frameAtIndex);

  // const radios = additionalTwistCurves
  //   .map(({ curve, frameAtIndex, metadata }, i) => {
  //     const label = document.createElement('label');
  //     label.appendChild(document.createTextNode(metadata.name));

  //     const radio = document.createElement('input');
  //     radio.id = 'additional-twist-curve';
  //     radio.name = 'additional-twist-curve';
  //     radio.type = 'radio';
  //     radio.value = i;
  //     radio.checked = i === 0;

  //     label.htmlFor = radio.id;

  //     radio.addEventListener('change', () => {
  //       updateThreeJSGeometryFromCurve(mesh.geometry, curve, frameAtIndex);
  //     });

  //     form.appendChild(label);
  //     form.appendChild(radio);

  //     return radio;
  //   });

  // TODO: make this a dynamic button that reflects the current state of the
  // optimization, and add some additional information about the optimization.
  const button = document.createElement('button');
  button.innerHTML = 'Optimize';
  canvas.parentNode.appendChild(button);

  button.addEventListener('click', () => {
    console.log('starting optimization...');
  });

  app
    .customizeScene((scene, camera) => { camera.position.z = 5; })
    .addGeometry(geometry)
    .render();
}
