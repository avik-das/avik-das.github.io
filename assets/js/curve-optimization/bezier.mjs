/**
 * A representation of a Bézier curve, defined by a number of control points.
 *
 * The Bézier curve can be defined with as many control points as desired, and
 * N control points will define a single polynomial of degree N - 1, with the
 * parameter ranging from [0, 1].
 *
 * Uses any vector representation that behaves like `Vec3` from `vec3.mjs`.
 */
export default class BezierCurve {
  /**
   * Create a new Bézier curve.
   *
   * @param controlPoints - all the control points defining the curve
   */
  constructor(controlPoints) {
    this.controlPoints = controlPoints;
  }

  get numControlPoints() { return this.controlPoints.length; }

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
}
