/**
 * Wraps around a curve in order to computes and cache points sampled along the
 * curve. Exposes other information about those points, like the Frenet-Serret
 * frame at any sampled point.
 *
 * If arbitrary points need to be retrieved from the curve, then the original,
 * unwrapped curve should be referenced directly.
 */
export default class SampledCurve {
  constructor(curve, numSamples) {
    this.curve = curve;

    this._sampledPointsWithPadding = this._samplePointsWithPadding(numSamples);
    this.sampledPoints = this._sampledPointsWithPadding.slice(
      2,
      this._sampledPointsWithPadding.length - 2
    );
  }

  get numSampledPoints() { return this.sampledPoints.length; }

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
      sampledPoints.push(this.curve.at(t));
    }

    return sampledPoints;
  }
}
