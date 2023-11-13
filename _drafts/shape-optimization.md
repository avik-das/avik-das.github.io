---
title: "WIP - Shape optimization"
layout: blog
has_math: true
---

<div class="container-interactive-canvas">
  <div class="interactive-diagram">
    <canvas
      id="container-3d-optimizing-figure-8"
      class="container-3d"
      width="512"
      height="512"></canvas>
  </div>
</div>

<script src="/assets/js/playable-demo.js"></script>
<script type="module">
  import {
    renderAppWithOptimizingFigureEight
  } from '/assets/js/todo-shape-optimization.mjs';

  window.addEventListener('DOMContentLoaded', () => {
    const demo = (containerIdSuffix, renderer) =>
      createPlayableDemo(
        document.querySelector(`#container-3d-${containerIdSuffix}`),
        renderer
      );

    demo('optimizing-figure-8', renderAppWithOptimizingFigureEight);
  });
</script>
