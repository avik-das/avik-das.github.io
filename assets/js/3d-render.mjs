import * as THREE
  from 'https://unpkg.com/three@0.120.1/build/three.module.js';
import { OrbitControls }
  from 'https://unpkg.com/three@0.120.1/examples/jsm/controls/OrbitControls.js';

/**
 * A simple three.js-based app to render a 3D model into the given canvas.
 * Abstracts over some boilerplate, setting up functionality such as:
 *
 * - Standard lighting and camera configurations.
 * - Pointer controls.
 * - Easy to add meshes (with standard materials) given some geometry.
 *
 * Usage:
 *
 * ```js
 * new ModelViewerApp(canvas)
 *   .customizeScene((scene, camera) => { optionally update scene & camera })
 *   .addGeometry(geometry with positions, colors, normals, etc.)
 *   .render();
 * ```
 */
export class ModelViewerApp {
  /**
   * Prepare the app for rendering. At this point, the `render` function can
   * already be called, but there are no models to render.
   */
  constructor(canvas) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    scene.add(new THREE.HemisphereLight());

    const camera = new THREE.PerspectiveCamera(
      /* vertical FOV (in degrees) = */ 45,
      /* aspect ratio = */ canvas.clientWidth / canvas.clientHeight,
      /* near = */ 0.1,
      /* far = */ 100
    );

    const controls = new OrbitControls(camera, canvas);
    controls.update();

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);

    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
  }

  /**
   * Customize the prepared scene. Useful for customizing properties like where
   * the camera is, what additional lights to add, etc.
   *
   * The given callback takes in the following parameters:
   *
   * - The three.js `Scene`
   * - The three.js `Camera` that will be used to render the scene
   *
   * @return `this` for chaining
   */
  customizeScene(customizer) {
    customizer(this.scene, this.camera);
    return this;
  }

  /**
   * Convenience method for adding a standard 3D model to render, given a
   * three.js `Geometry` object. The geometry should have normals and colors
   * for each vertex, as the corresponding material will have be
   * light-sensitive and have per-vertex colors enabled.
   *
   * @return `this` for chaining
   */
  addGeometry(geometry) {
    const material = new THREE.MeshPhongMaterial({
      side: THREE.FrontSide,
      vertexColors: true
    });

    this.scene.add(new THREE.Mesh(geometry, material));
    return this;
  }

  /**
   * Start the main loop.
   */
  render() {
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }
}
