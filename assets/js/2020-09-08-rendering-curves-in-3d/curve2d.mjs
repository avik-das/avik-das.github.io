import Vec3 from '/assets/js/vec3.mjs';
import BezierCurve from '/assets/js/curve-optimization/bezier.mjs';
import { html, render }
  from 'https://unpkg.com/htm@3.0.4/preact/index.mjs?module';
import { useCallback, useState }
  from 'https://unpkg.com/preact@10.4.8/hooks/dist/hooks.mjs?module';

const Curve2DApp = () => html`
  <${Curve2D}
    controlPoints=${[
      new Vec3(15,  35, 0),
      new Vec3(35,   0, 0),
      new Vec3(65,  90, 0),
      new Vec3(85,  25, 0),
    ]} />
`;

function Curve2D(props) {
  const [curve, setCurve] = useState(null);
  const [t, setT] = useState(0.75);

  const createCurve =
    numSamples => new BezierCurve(props.controlPoints, numSamples);

  // Performance optimization: `useState` is called every time this component
  // is rendered. So, it's important to not construct a "default" curve if not
  // necessary. This means initializing `curve` to be `null`, then immediately
  // using `setCurve` to initialize it correctly on the first render.
  if (!curve) {
    setCurve(createCurve(40));
    return;
  }

  const onNumSamplesChanged = useCallback(
    numSamples => { setCurve(createCurve(numSamples)); },
    [curve]
  );

  const onTChanged = useCallback(
    value => { setT(value / (curve.numSampledPoints - 1)); },
    [t, curve]
  );

  const pathCommands = pathCommandsFromPoints(curve.sampledPoints);

  const selectedPointIndex = Math.round(t * (curve.numSampledPoints - 1));
  const selectedPoint = curve.sampledPoints[selectedPointIndex];
  const tangent = curve.tangentAtIndex(selectedPointIndex).mul(20);
  const normal = curve.normalAtIndex(selectedPointIndex).mul(40);

  return html`
    <div class="interactive-diagram">
      <svg viewBox="0 0 100 75">
        <defs>
          <marker
            id="pointer"
            viewBox="0 0 10 10"
            markerWidth="6"
            markerHeight="6"
            refX="9"
            refY="4.5"
            orient="auto-start-reverse">
            <path
              d="M 1 1 L 9 4.5 L 1 8"
              stroke="black"
              stroke-width="1.67"
              fill="transparent" />
          </marker>
        </defs>

        <path
          d=${pathCommands}
          stroke="black"
          stroke-width="0.5"
          fill="transparent" />

        <circle
          cx=${selectedPoint.x}
          cy=${selectedPoint.y}
          r="1"
          stroke="transparent"
          fill="red" />

        <${SVGVector}
          p0=${selectedPoint}
          p1=${selectedPoint.add(tangent)}
          color="blue" />
        <${SVGVector}
          p0=${selectedPoint}
          p1=${selectedPoint.add(normal.normalized.mul(20))}
          color="yellowgreen" />
        <${SVGVector}
          p0=${selectedPoint}
          p1=${selectedPoint.add(normal)}
          color="darkgreen" />
      </svg>

      <form>
        <label for="num-samples"># of samples</label>
        <input
          name="num-samples"
          type="range"
          min="5" max="50" step="1"
          value=${curve.numSampledPoints}
          onInput=${evt => onNumSamplesChanged(evt.target.valueAsNumber)} />

        <label for="selected-point">Point along curve</label>
        <input
          name="selected-point"
          type="range"
          min="0" max=${curve.numSampledPoints - 1} step="1"
          value=${selectedPointIndex}
          onInput=${evt => onTChanged(evt.target.valueAsNumber)} />
        </form>
    </div>
  `;
}

const SVGVector = ({p0, p1, color}) => {
  const pathCommands = pathCommandsFromPoints([p0, p1]);

  return html`
    <path
      d=${pathCommands}
      stroke=${color}
      stroke-width="0.5"
      fill="transparent"
      marker-end=url(#pointer) />
  `;
}

/**
 * Given a list of 2D points, construct a string:
 *
 * - Starting with an `M` command.
 * - Followed by a series of `L` commands.
 *
 * This string is then suitable for constructing a segmented line in SVG.
 */
const pathCommandsFromPoints = points => points
  .map((p, i) => {
    const pos = `${p.x} ${p.y}`;
    return i === 0 ? `M${pos}` : `L${pos}`;
  })
  .join(' ');

/**
 * Render the 2D visualization application into the given container (typically
 * an empty `div`).
 */
export default container => render(html`<${Curve2DApp} />`, container);
