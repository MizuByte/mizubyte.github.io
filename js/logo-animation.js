// Logo animation JS (WebGL + TWGL)
const mediaList = [
  "./videos/ezgif-767ed7843f54ec.mp4", // User's local ezgif file
  "./videos/ezgif-767ed7843f54ec.mp4"
];
const rndNum = Math.floor(Math.random() * mediaList.length);
const src = mediaList[rndNum];
let mediaElem;
if (src.endsWith('.gif')) {
  mediaElem = document.createElement('img');
  mediaElem.src = src;
  mediaElem.crossOrigin = "anonymous";
  mediaElem.style.display = 'none';
  document.body.appendChild(mediaElem);
} else {
  mediaElem = document.createElement('video');
  mediaElem.src = src;
  mediaElem.crossOrigin = "anonymous";
  mediaElem.loop = true;
  mediaElem.muted = true;
  mediaElem.play();
  mediaElem.style.display = 'none';
  document.body.appendChild(mediaElem);
}

const glcanvas = document.getElementById("canvas");
const gl = glcanvas.getContext("webgl2");

const programInfo = twgl.createProgramInfo(gl, [
  "vertexShader",
  "fragmentShader"
]);

const arrays = {
  position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
  texcoord: { numComponents: 2, data: [0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1] }
};

const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
const textures = twgl.createTextures(gl, {
  video: { src: mediaElem, min: gl.LINEAR, wrap: [gl.REPEAT, gl.REPEAT] }
});

const render = (time) => {
  twgl.resizeCanvasToDisplaySize(gl.canvas, 1.0);

  let videoReady = false;
  if (mediaElem instanceof HTMLVideoElement) {
    videoReady = mediaElem.readyState >= mediaElem.HAVE_CURRENT_DATA && !mediaElem.paused && !mediaElem.ended;
  } else if (mediaElem instanceof HTMLImageElement) {
    videoReady = mediaElem.complete;
  }

  if (videoReady) {
    gl.bindTexture(gl.TEXTURE_2D, textures.video);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mediaElem);
  }

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  twgl.setUniforms(programInfo, {
    u_time: time * 0.001,
    u_video: textures.video,
    u_resolution: [gl.canvas.width, gl.canvas.height]
  });
  twgl.drawBufferInfo(gl, bufferInfo);

  requestAnimationFrame(render);
};

window.addEventListener("DOMContentLoaded", (event) => {
  requestAnimationFrame(render);
});
