/**
 * A representation of a B-Spline, where the spline meets up with itself.
 *
 * The B-Spline can be defined with as many control points as desired, and then
 * sampled as a connected set of polynomials, all with the same specified
 * degree. The parameter ranges between [0, 1] across the entire set of
 * polynomials.
 *
 * Uses any vector representation that behaves like `Vec3` from `vec3.mjs`.
 */
export default class ClosedBSpline {
  /**
   * Create a new B-Spline.
   *
   * @param controlPoints - all the control points defining the curve
   * @param degree - the degree of the curve
   * @param numSamples - the number of points to sample and cache
   */
  constructor(controlPoints, degree, numSamples) {
    this.degree = degree;
    this.controlPoints = controlPoints;
  }

  get numControlPoints() { return this.controlPoints.length; }

  /**
   * Implementation of De Boor's algorithm for evaluating a B-Spline. Maps
   * values outside of the [0, 1] range back into that range, in order to
   * provide the abstraction of closed curve.
   *
   * See https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/de-Boor.html
   */
  at(t) {
    // Move "t" into the [0, 1] range.
    if (t > 1.0 || t < 0.0) { t = t % 1; }
    if (t < 0.0) { t += 1.0; }

    // Because we'll be indexing into the control points, rescale "t" based on
    // the number of control points. Also offset it by "degree", because that's
    // how many control points before the closest one to "t" we'll need.
    t = t * this.numControlPoints + this.degree;

    // Determine which control points are actually needed for the given "t".
    const bases = [];
    const k = Math.floor(t);
    for (let i = 0; i <= this.degree; i++) {
      const cpi = (k - this.degree + i) % this.numControlPoints;
      bases.push(this.controlPoints[cpi]);
    }

    // Recursive form of B-Spline interpolation. De Boor's algorithm works by
    // inserting a control point at "t" enough times that the control point
    // appears "degree" times.
    //
    // Theoretically, if there's already a control point at "t" that appears
    // "c" times, we could just insert control points "degree - c" times. But,
    // we'll assume that's not the case.
    //
    // Inserting the new control points happens by interpolation of consecutive
    // control points. This is why, at each iteration of the outer loop, one
    // fewer control point is inserted compared to the previous iteration. And,
    // because of the order in which the control points from the previous
    // iteration are used, we can simply overwrite the old control points in
    // the same array.
    //
    // The first iteration is done outside this loop, when we copy the original
    // control points. After the last iteration, only one control point is
    // left, which is the point we want.
    for (let power = 1; power <= this.degree; power++) {
      for (let i = 0; i <= this.degree - power; i++) {
        const knot = k - this.degree + power + i;

        const u_i = knot;
        const u_ipr1 = knot + this.degree - power + 1;

        const a = (t - u_i) / (u_ipr1 - u_i);
        bases[i] = bases[i].lerp(bases[i + 1], a);
      }
    }

    return bases[0];
  }

  /**
   * Update the specified control point by applying deltas to each coordinate.
   * Do so with an in-place mutation. Note that doing this type of mutation is
   * dangerous, as all dependent changes, such as the pre-calculated sampling of
   * the curve, the RMFs, etc. will also need to be updated.
   *
   * TODO: questions - can we get away without an in-place update, even though
   *   that would end up creating a lot of new objects?
   */
  applyDeltaToControlPointInPlace(cpi, dx, dy, dz) {
    this.controlPoints[cpi].x += dx;
    this.controlPoints[cpi].y += dy;
    this.controlPoints[cpi].z += dz;
  }
}
