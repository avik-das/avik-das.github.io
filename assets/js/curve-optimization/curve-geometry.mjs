import * as THREE from 'https://unpkg.com/three@0.120.1/build/three.module.js';

/**
 * Computes and caches the Rotation Minimizing Frames for a curve. One frame is
 * computed for each sampled point on the curve. The curve can be modeled in
 * any way that's desirable, as long as it contains the following fields:
 *
 * 1. `numSampledPoints` - the number of sampled points
 * 2. `sampledPoints` - an array of `Vec3` objects, one for each sampled point
 */
export class RotationMinimizingFrames {
  constructor(curve) {
    this.frames = this._computeFrames(curve);
  }

  _computeFrames(curve) {
    const frames = [];

    const { t: t0, n: r0, b: s0 } = curve.frenetSerretFrameAtIndex(0);
    frames.push({ t: t0, r: r0, s: s0 });

    // Use the double-reflection method detailed in
    // https://www.microsoft.com/en-us/research/wp-content/uploads/2016/12/Computation-of-rotation-minimizing-frames.pdf
    for (let i = 0; i < curve.numSampledPoints - 1; i++) {
      const j = i + 1;

      const xi = curve.sampledPoints[i];
      const xj = curve.sampledPoints[j];

      const { t: ti, r: ri } = frames[frames.length - 1];
      const tj = curve.tangentAtIndex(j);

      const v1 = xj.sub(xi);
      const c1 = v1.dot(v1);
      const rl = ri.sub(v1.mul(2 / c1 * v1.dot(ri)));
      const tl = ti.sub(v1.mul(2 / c1 * v1.dot(ti)));

      const v2 = tj.sub(tl);
      const c2 = v2.dot(v2);
      const rj = rl.sub(v2.mul(2 / c2 * v2.dot(rl)));
      const sj = tj.cross(rj);

      frames.push({ t: tj, r: rj, s: sj });
    }

    return frames;
  }
}

/**
 * Construct a 3D mesh and a `BufferGeometry` from the given one-dimensional
 * curve.
 *
 * Because a one-dimensional curve has no defined notion of orientation, the
 * second parameter `frameAtIndex` must be supplied to provide the moving frame
 * at each sampled point index. The function takes in a point index and returns
 * an object containing three vectors:
 *
 * - `f` - the forward vector, also known as the tangent
 * - `r` - the reference vector that defines the orientation of the frame
 * - `u` - the up vector, which is simply `f.cross(u)`
 *
 * The input curve can be modeled in any way that's desirable, as long as it
 * contains the following fields:
 *
 * 1. `numSampledPoints` - the number of sampled points
 * 2. `sampledPoints` - an array of `Vec3` objects, one for each sampled point
 */
export function threeJSGeometryFromCurve(curve, frameAtIndex) {
  const CROSS_SECTION_COLORS = [
    [0.17, 0.43, 0.73],
    [1.00, 0.39, 0.12],
    [0.18, 0.64, 0.72],
    [1.00, 0.92, 0.41],
  ];

  const N = CROSS_SECTION_COLORS.length;
  const M = curve.numSampledPoints;

  const uniquePoints = curve.sampledPoints.map((_, pi) => {
    const {
      f: forward,
      r: normal,
      u: upward
    } = frameAtIndex(pi);

    return CROSS_SECTION_COLORS.map((_, ci) => {
      const angle = ci * Math.PI * 2 / N + Math.PI / 4;

      return normal
        .clone()
        .mul(Math.cos(angle))
        .add(upward.mul(Math.sin(angle)))
        .mul(0.2)
        .add(curve.sampledPoints[pi]);
    });
  });

  const positions = [];
  const normals = [];
  const colors = [];

  positions.push.apply(positions, uniquePoints[0]);
  positions.push.apply(positions, uniquePoints[M - 1]);
  colors.push.apply(colors, positions.map(() => [0.2, 0.2, 0.2]));

  const normal0 = uniquePoints[0][0].sub(uniquePoints[0][1])
    .cross(uniquePoints[0][2].sub(uniquePoints[0][1]))
    .normalized;

  const normal1 = uniquePoints[M - 1][0].sub(uniquePoints[M - 1][1])
    .cross(uniquePoints[M - 1][2].sub(uniquePoints[M - 1][1]))
    .negated
    .normalized;

  normals.push.apply(normals, uniquePoints[0].map(() => normal0));
  normals.push.apply(normals, uniquePoints[M - 1].map(() => normal1));

  for (let pi = 0; pi < curve.numSampledPoints; pi++) {
    for (let ci = 0; ci < N; ci++) {
      const cj = (ci + 1) % N;
      const normal = uniquePoints[pi][ci]
        .mean(uniquePoints[pi][cj])
        .sub(curve.sampledPoints[pi])
        .normalized;

      positions.push(uniquePoints[pi][ci]);
      positions.push(uniquePoints[pi][cj]);

      normals.push(normal);
      normals.push(normal);

      colors.push(CROSS_SECTION_COLORS[ci]);
      colors.push(CROSS_SECTION_COLORS[ci]);
    }
  }

  const indices = [
    [0, 2, 1],
    [0, 3, 2],
    [4, 5, 6],
    [4, 6, 7],
  ];

  for (let pi = 0; pi < M - 1; pi++) {
    const pj = (pi + 1) % M;

    for (let ci = 0; ci < N * 2; ci += 2) {
      const cj = (ci + 1) % (N * 2);

      const oi = pi * 2 * N + 2 * N;
      const oj = pj * 2 * N + 2 * N;

      indices.push([oj + cj, oi + ci, oi + cj]);
      indices.push([oj + ci, oi + ci, oj + cj]);
    }
  }

  const bufferFromNestedArrays = arrays =>
    new THREE.Float32BufferAttribute(arrays.flatMap(ary => [...ary]), 3);

  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices.flat());
  geometry.setAttribute('position', bufferFromNestedArrays(positions));
  geometry.setAttribute('normal', bufferFromNestedArrays(normals));
  geometry.setAttribute('color', bufferFromNestedArrays(colors));

  return geometry;
}
