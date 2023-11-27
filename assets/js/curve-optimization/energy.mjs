// Pieces
//
// - Gradient Descent Optimizer - uses deltas and energy calculation
// - Line Energy Calculation - uses deltas
// - Delta

export class GradientDescentOptimizer {
  ENERGY_IMPROVEMENT_THRESHOLD = 0.0001;

  constructor(
    numParams,

    stepSizeStart,
    stepSizeEnd,

    energyCalculator,
    changeApplier
  ) {
    this.numParams = numParams;

    this.stepSize = stepSizeStart;
    this.stepSizeEnd = stepSizeEnd;

    this.energyCalculator = energyCalculator;
    this.changeApplier = changeApplier;
  }

  // TODO: document returned boolean
  runStep() {
    const isDecrease = (original, updated) =>
      (original > updated) &&
      (original - updated > this.ENERGY_IMPROVEMENT_THRESHOLD);

    const energyStart = this.energyCalculator.calculateEnergy();
    console.log('start energy:', energyStart, 'step size:', this.stepSize);

    const delta = new Array(this.numParams).fill(0);
    const done = new Array(this.numParams).fill(false);
    const dparam = this.stepSize;

    const deltaToCommit = new Array(this.numParams).fill(0);

    for (let i = 0; i < this.numParams; i++) {
      // Start by increasing the parameter value
      delta[i] = dparam;
      this.changeApplier.applyDelta(delta);
      const energyLarge = this.energyCalculator.calculateEnergy();

      // Now decrease it by the same amount. Note that we have to apply a change
      // with twice the desired magnituted to cancel out the previous change.
      delta[i] = -2 * dparam;
      this.changeApplier.applyDelta(delta);
      const energySmall = this.energyCalculator.calculateEnergy();

      // Finally, reset to the original value.
      delta[i] = dparam;
      this.changeApplier.applyDelta(delta);

      // Make sure the delta for the current parameter is back to zero when
      // tweaking the next parameter.
      delta[i] = 0;

      if (
        isDecrease(energyStart, energyLarge) ||
        isDecrease(energyStart, energySmall)
      ) {
        // TODO: document why
        deltaToCommit[i] = energySmall - energyLarge;
      } else {
        // TODO: document why
        done[i] = this.stepSize <= this.stepSizeEnd;
      }
    }

    let changeWasSuccessful = false;

    if (deltaToCommit.some(p => p !== 0)) {
      const magnitude = Math.sqrt(deltaToCommit.reduce((sum, p) => sum + p * p, 0));
      deltaToCommit.forEach((p, i) => {
        deltaToCommit[i] = p / magnitude;
      });

      this.changeApplier.applyDelta(deltaToCommit);
      const energyAfterChange = this.energyCalculator.calculateEnergy();
      // TODO: document why this combined change may not actually be good
      if (isDecrease(energyStart, energyAfterChange)) {
        changeWasSuccessful = true;
        console.log('successfully found update', deltaToCommit);
      } else {
        // Undo the change
        deltaToCommit.forEach((p, i) => { deltaToCommit[i] = -p; });
        this.changeApplier.applyDelta(deltaToCommit);
        console.log('No update possible');
      }
    }

    if (!changeWasSuccessful) {
      if (this.stepSize > this.stepSizeEnd) {
        this.stepSize /= 2;
      }
    }

    return done.every(p => p);
  }
}

export class ClosedCurveEnergy {
  ELASTICITY = 10;

  constructor(sampledCurve, twistWeight) {
    this.sampledCurve = sampledCurve;
    // this.restLength = this._calculateStrutLength(sampledCurve);
    this.restLength = 2; // TODO - remove

    this.twistWeight = twistWeight;
  }

  calculateEnergy() {
    let energy = 0;

    const { curve: { controlPoints, numControlPoints } } = this.sampledCurve;

    for (let i = 0; i < numControlPoints; i++) {
      // TODO: document
      const p0 = controlPoints[(i + numControlPoints - 1) % numControlPoints];
      const p1 = controlPoints[i];
      const p2 = controlPoints[(i + 1) % numControlPoints];

      const strut0 = p0.sub(p1);
      const strut1 = p2.sub(p1);

      const l0 = strut0.norm;
      const l1 = strut1.norm;

      const normdot = strut0.dot(strut1) / (l0 * l1);
      const k1 = Math.PI - Math.acos(this._clamp(normdot, -1, 1));

      // TODO: document Hooke's law
      const stretch0 = this.restLength - l0;
      const stretch1 = this.restLength - l1;
      const spring0 = 0.5 * this.ELASTICITY * stretch0 * stretch0;
      const spring1 = 0.5 * this.ELASTICITY * stretch1 * stretch1;
      const averageSpring = (spring0 + spring1) / 2;

      const bending = (1 - this.twistWeight) * k1 * k1;
      const stretch = averageSpring * averageSpring;

      energy += bending + stretch;
    }

    // TODO: incorporate twist

    return energy;
  }

  _calculateStrutLength({ curve: { controlPoints, numControlPoints } }) {
    let totalLength = 0;
    for (let i = 0; i < numControlPoints; i++) {
      const j = (i === 0 ? numControlPoints : i) - 1;
      totalLength += controlPoints[i].dist(controlPoints[j]);
    }

    return totalLength / numControlPoints;
  }

  _clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
}

export class ParameterDeltaToControlPointApplication {
  constructor(unsampledCurve) {
    this.unsampledCurve = unsampledCurve;
  }

  applyDelta(delta) {
    for (let i = 0; i < delta.length; i += 3) {
      const dx = delta[i    ];
      const dy = delta[i + 1];
      const dz = delta[i + 2];

      this.unsampledCurve.applyDeltaToControlPointInPlace(i / 3, dx, dy, dz);
    }
  }
}
