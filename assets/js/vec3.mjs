/**
 * A representation of a 3D vector, with helpful operations.
 *
 * While I could import vec3 from the GL Matrix library, or from the three.js
 * 3D engine, not all my usages of 3D vectors are to render WebGL content. This
 * representation is lightweight (though not performant due to the number of
 * memory allocations) and fine for general-purpose use.
 */
export default class Vec3 {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  add(v) { return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z); }
  sub(v) { return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z); }
  mul(c) { return new Vec3(this.x * c  , this.y * c  , this.z * c); }
  div(c) { return new Vec3(this.x / c  , this.y / c  , this.z / c); }

  get negated() { return this.mul(-1); }

  dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
  get norm() { return Math.sqrt(this.dot(this)); }
  get normalized() { return this.div(this.norm); }

  dist(v) { return this.sub(v).norm; }

  cross(v) {
    return new Vec3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x
    );
  }

  get coordinates() { return [this.x, this.y, this.y]; }
  *[Symbol.iterator]() {
    yield this.x;
    yield this.y;
    yield this.z;
  }

  clone() { return new Vec3(this.x, this.y, this.z); }

  lerp(v, t) { return this.mul(1 - t).add(v.mul(t)); }
  mean(v) { return this.sub(v).div(2).add(v); }
}
