/**
 * A representation of a Bézier curve, defined by a number of control points.
 * When the curve is constructed, the curve is sampled at a fixed number of
 * locations, and all further calculations are performed on those samples.
 *
 * The Bézier curve can be defined with as many control points as desired, and
 * N control points will define a single polynomial of degree N - 1, with the
 * parameter ranging from [0, 1]. Points on the curve are sampled and cached,
 * but arbitrary points along the curve can also be sampled later if needed.
 *
 * Uses any vector representation that behaves like `Vec3` from `vec3.mjs`.
 */
export default class BezierCurve {
  /**
   * Create a new Bézier curve.
   *
   * @param controlPoints - all the control points defining the curve
   * @param numSamples - the number of points to sample and cache
   */
  constructor(controlPoints, numSamples) {
    this.controlPoints = controlPoints;

    this._sampledPointsWithPadding = this._samplePointsWithPadding(numSamples);
    this.sampledPoints = this._sampledPointsWithPadding.slice(
      2,
      this._sampledPointsWithPadding.length - 2
    );
  }

  get numControlPoints() { return this.controlPoints.length; }
  get numSampledPoints() { return this.sampledPoints.length; }

  /**
   * Simple implementation of De Casteljau's algorithm for evaluating
   * Bézier curves.
   */
  at(t) {
    let prevPoints = this.controlPoints;
    let nextPoints = [];

    while (prevPoints.length > 1) {
      for (let i = 0; i < prevPoints.length - 1; i++) {
        const v0 = prevPoints[i];
        const v1 = prevPoints[i + 1];
        nextPoints.push(v0.lerp(v1, t));
      }

      prevPoints = nextPoints;
      nextPoints = [];
    }

    return prevPoints[0];
  }

  /**
   * Compute and return the tangent vector at the given sampled point
   * index, using the previous and next sampled points to approximate the
   * change in position over time.
   *
   * The returned vector is always normalized (unit length) because the
   * tangent vector should not depend on how far apart the sampled points
   * are spaced.
   */
  tangentAtIndex(i) {
    // NOTE: account for extra points at the beginning of the padded array
    // of sampled points when indexing into that array.
    return this._sampledPointsWithPadding[i + 3]
      .sub(this._sampledPointsWithPadding[i + 1])
      .normalized;
  }

  /**
   * Compute and return the normal vector at the given sampled point index,
   * using the previous and next sampled points to approximate the
   * change in the tangent vector over time.
   *
   * The returned vector is of variable length because the length captures
   * how fast the curve is changing direction.
   */
  normalAtIndex(i) {
    return this.tangentAtIndex(i + 1)
      .sub(this.tangentAtIndex(i - 1));
  }

  /**
   * Compute the Frenet-Serret frame at the given sampled point index. The
   * frame consists of:
   *
   * 1. The tangent vector at the sampled point.
   * 2. The normal vector at the sample point.
   * 3. The binormal vector at the sampled point, which is the cross-product
   *    of the tangent and normal vectors.
   *
   * All three components are unit vectors.
   *
   * The calculation here is not strictly correct, because the Frenet-Serret
   * formulas are defined with respect to the arc-length parameterization of
   * the curve. Here, for simplicity, the time parameterization is used as an
   * approximation.
   *
   * See: https://en.wikipedia.org/wiki/Frenet%E2%80%93Serret_formulas
   */
  frenetSerretFrameAtIndex(i) {
    const tangent = this.tangentAtIndex(i);
    const normal = this.normalAtIndex(i).normalized;
    const binormal = tangent.cross(normal);

    return {
      t: tangent,
      n: normal,
      b: binormal
    };
  }

  _samplePointsWithPadding(numSamples) {
    const sampledPoints = [];
    for (let i = -2; i <= numSamples + 1; i++) {
      let t = i / (numSamples - 1);
      sampledPoints.push(this.at(t));
    }

    return sampledPoints;
  }
}
