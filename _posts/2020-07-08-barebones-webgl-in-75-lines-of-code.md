---
title: "Barebones WebGL in 75 lines of code"
layout: blog
cover-img: /assets/images/2020-07-08-barebones-webgl-in-75-lines-of-code/multi-colored-triangle.png
---

Modern OpenGL, and by extension WebGL, is very different from the legacy OpenGL I learned in the past. I understand how rasterization works, so I'm comfortable with the concepts. However, every tutorial I've read introduced abstractions and helper functions that make it harder for me to understand which parts are truly core to the OpenGL APIs.

To be clear, abstractions like separating positional data and rendering functionality into separate classes is important in a real-world application. But, these abstractions spread code across multiple areas, and introduce overhead due to boilerplate and passing around data between logical units. The way I _learn_ best is a linear flow of code where every line is core to the subject at hand.

First, credit goes to [the tutorial I used](https://www.toptal.com/javascript/3d-graphics-a-webgl-tutorial). Starting from this base, I stripped down all the abstractions until I had a "minimal viable program". Hopefully, this will help you get off the ground with modern OpenGL. Here's what we're making:

<figure markdown="1">
![An equilateral triangle, green on top, black on the bottom-left and red on the bottom-right, with colors interpolated in between.]({{ page.cover-img }})
<figcaption markdown="1">A slightly more colorful version of [the black triangle](https://rampantgames.com/blog/?p=7745)
</figcaption>
</figure>

## Initialization

With WebGL, we need a `canvas` to paint on. You'll definitely want to include all the usual HTML boilerplate, some styling, etc., but the canvas is the most crucial. Once the DOM has loaded, we'll be able to access the canvas using Javascript.

```html
<canvas id="container" width="500" height="500"></canvas>

<script>
  document.addEventListener('DOMContentLoaded', () => {
    // All the Javascript code below goes here
  });
</script>
```

With the canvas accessible, we can get the WebGL rendering context, and initialize its clear color. Colors in the OpenGL world are RGBA, with each component between `0` and `1`. The clear color is the one used to paint the canvas at the beginning of any frame that redraws the scene.

```js
const canvas = document.getElementById('container');
const gl = canvas.getContext('webgl');

gl.clearColor(1, 1, 1, 1);
```

There's more initialization that can, and in real programs should, be done. Of particular note is enabling the _depth buffer_, which would allow sorting geometry based on the Z coordinates. We'll avoid that for this basic program consisting of only one triangle.

## Compile shaders

OpenGL is at its core a rasterization framework, where _we_ get to decide how to implement everything but the rasterization. This entails running at minimum two pieces of code on the GPU:

1. A vertex shader that runs for each piece of input, outputting one 3D (really, 4D in [homogeneous coordinates](https://en.wikipedia.org/wiki/Homogeneous_coordinates)) positions per input.

1. A fragment shader that runs for each pixel on the screen, outputting what color that pixel should be.

In between these two steps, OpenGL takes the geometry from the vertex shader and determines which pixels on the screen are actually covered by that geometry. This is the rasterization part.

Both shaders are typically written in GLSL (OpenGL Shading Language), which is then compiled down to machine code for the GPU. The machine code is then sent to the GPU, so it can be run during the rendering process. I won't spend much time on GLSL, as I'm only trying to show the basics, but the language is sufficiently close to C to be familiar to most programmers.

First, we compile and send a vertex shader to the GPU. Here, the source code for the shader is stored in a string, but it can be loaded from other places. Ultimately, the string is sent to the WebGL APIs.

```js
const sourceV = `
  attribute vec3 position;
  varying vec4 color;

  void main() {
    gl_Position = vec4(position, 1);
    color = gl_Position * 0.5 + 0.5;
  }
`;

const shaderV = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(shaderV, sourceV);
gl.compileShader(shaderV);

if (!gl.getShaderParameter(shaderV, gl.COMPILE_STATUS)) {
  console.error(gl.getShaderInfoLog(shaderV));
  throw new Error('Failed to compile vertex shader');
}
```

Here, there are a few variables in the GLSL code worth calling out:

1. An _attribute_ called `position`. An attribute is essentially an input, and the shader is called for each such input.

1. A _varying_ called `color`. This is an output from the vertex shader (one per input), and an input to the fragment shader. By the time the value is passed to the fragment shader, the value will be interpolated based on the properties of the rasterization.

1. The `gl_Position` value. Essentially an output from the vertex shader, like any varying value. This one is special because it's used to determine which pixels need to be drawn at all.

There's also a variable type called _uniform_, which is will be constant across multiple invocations of the vertex shader. These uniforms are used for properties like the transformation matrix, which will be constant for all vertices on a single piece of geometry.

Next, we do the same thing with fragment shader, compiling and sending it to the GPU. Notice the `color` variable from the vertex shader is now read by the fragment shader.

```js
const sourceF = `
  precision mediump float;
  varying vec4 color;

  void main() {
    gl_FragColor = color;
  }
`;

const shaderF = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(shaderF, sourceF);
gl.compileShader(shaderF);

if (!gl.getShaderParameter(shaderF, gl.COMPILE_STATUS)) {
  console.error(gl.getShaderInfoLog(shaderF));
  throw new Error('Failed to compile fragment shader');
}
```

Finally, both the vertex and fragment shader are linked into a single OpenGL program.

```js
const program = gl.createProgram();
gl.attachShader(program, shaderV);
gl.attachShader(program, shaderF);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  console.error(gl.getProgramInfoLog(program));
  throw new Error('Failed to link program');
}

gl.useProgram(program);
```

We tell the GPU that the shaders we defined above are the ones we want to run. So, now what's left is to create the inputs and let the GPU loose on those inputs.

## Send the input data to the GPU

The input data will be stored in the GPU's memory and processed from there. Instead of making separate draw calls for each piece of input, which would transfer the relevant data one piece at a time, the entire input is transferred to the GPU and read from there. (Legacy OpenGL would transfer data one piece at at time, leading to worse performance.)

OpenGL provides an abstraction known as a Vertex Buffer Object (VBO). I'm still figuring out how all of this works, but ultimately, we'll do the following using the abstraction:

1. Store a sequence of bytes in the CPU's memory.

1. Transfer the bytes to the GPU's memory using a unique buffer created using `gl.createBuffer()` and a _binding point_ of `gl.ARRAY_BUFFER`.

We'll have one VBO per input variable (attribute) in the vertex shader, though it's possible to use a single VBO for multiple inputs.

```js
const positionsData = new Float32Array([
  -0.75, -0.65, -1,
   0.75, -0.65, -1,
   0   ,  0.65, -1,
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, positionsData, gl.STATIC_DRAW);
```

Typically, you'll specify your geometry with whatever coordinates are meaningful to your application, then use a series of transformations in the vertex shader to get them into OpenGL's _clip space_. I won't go into the details of clip space (they have to do with homogeneous coordinates), but for now, X and Y vary from -1 to +1. Because our vertex shader just passes along the input data as is, we can specify our coordinates directly in clip space.

Next, we'll also associate the buffer with one of the variables in the vertex shader. Here, we:

1. Get a handle to the `position` variable from the program we created above.

1. Tell OpenGL to read data from the `gl.ARRAY_BUFFER` binding point, in batches of 3, with particular parameters like an offset and stride of zero.

```js
const attribute = gl.getAttribLocation(program, 'position');
gl.enableVertexAttribArray(attribute);
gl.vertexAttribPointer(attribute, 3, gl.FLOAT, false, 0, 0);
```

Note that we can create the VBO and associate it with the vertex shader attribute this way because we do both one after another. If we separated these two functions (for example creating all the VBOs in one go, then associating them to individual attributes), we would need to call `gl.bindBuffer(...)` before associating each VBO with its corresponding attribute.

## Draw!

Finally, with all the data in the GPU's memory set up the way we want, we can tell OpenGL to clear the screen and run the program on the arrays we set up. As part of the rasterization (determining which pixels are covered by the vertices), we tell OpenGL to treat the vertices in groups of 3 as triangles.

```js
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLES, 0, 3);
```

The way we've set this up in a linear fashion does mean the program runs in one shot. In any practical application, we'd store the data in a structured way, send it to the GPU whenever it changes, and perform the drawing every frame.

---

Putting everything together, the diagram below shows the minimal set of concepts that go into showing your first triangle on the screen. Even then, the diagram is heavily simplified, so your best bet is to put together the 75 lines of code presented in this article and study that.

<figure markdown="1">
![The full sequence of steps: shaders are created, data is transferred to the GPU via VBOs, the two are associated together, and then the GPU assembles everything into a final image.](/assets/images/2020-07-08-barebones-webgl-in-75-lines-of-code/full-sequence-diagram.png)
<figcaption>The final, though heavily simplified, sequence of steps needed to show the coveted triangle</figcaption>
</figure>

The hard part of learning OpenGL for me has been the sheer amount of boilerplate needed to get the most basic image on the screen. Because the rasterization framework requires us to provide 3D rendering functionality, and communicating with the GPU is verbose, there are many concepts to learn right up front. I hope this article shows the basics are simpler than other tutorials make them out to be!
