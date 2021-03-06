/**
 * Render a play button on the given canvas. When the play button is clicked,
 * replace the canvas with a fresh one (one without the play button), then
 * call the given render function to populate the new canvas.
 *
 * When the canvas is displaying the play button, the canvas is given a CSS
 * class of `playable-demo-play-button`. This can be used for styling the play
 * button without affecting the main demo.
 *
 * @param canvas  the canvas on which to display the play button
 * @param renderer  the function to call when the play button is clicked
 */
function createPlayableDemo(canvas, renderer) {
  const placeholder = document.createElement('canvas');
  placeholder.width = canvas.width;
  placeholder.height = canvas.height;
  placeholder.id = canvas.id;
  placeholder.classList.add('playable-demo-play-button');

  const ctx = placeholder.getContext('2d');

  const w = canvas.width;
  const h = canvas.height;

  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  // Circle outline
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.arc(cx, cy, 64, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // Triangle
  ctx.fillStyle = '#333';

  ctx.beginPath();
  ctx.moveTo(cx - 16, cy - 32);
  ctx.lineTo(cx + 32, cy);
  ctx.lineTo(cx - 16, cy + 32);
  ctx.closePath();
  ctx.fill();

  canvas.parentNode.replaceChild(placeholder, canvas);

  // On click, switch to the main demo. Do this by replacing the play button
  // canvas with a fresh canvas with the same ID and size.
  placeholder.addEventListener('click', () => {
    canvas.addEventListener('dblclick', () => {
      if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
      }
    });

    placeholder.parentNode.replaceChild(canvas, placeholder);
    renderer(canvas);
  });
}
