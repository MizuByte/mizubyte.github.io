// --- Right-click hold to temporarily resize logo and canvas ---
function setLogoSize(temp) {
  const logoDiv = document.querySelector('.logo-top-left');
  const canvas = document.getElementById('canvas');
  if (logoDiv && canvas) {
    if (temp) {
      logoDiv.style.width = '97.5%';
      logoDiv.style.height = '95%';
      canvas.style.width = '97.5%';
      canvas.style.height = '95%';
    } else {
      logoDiv.style.width = '';
      logoDiv.style.height = '';
      canvas.style.width = '';
      canvas.style.height = '';
    }
  }
}

// Logo animation JS (WebGL + TWGL)
const mediaList = [
  "https://mizubyte.github.io/videos/ezgif-767ed7843f54ec.mp4",
  "https://mizubyte.github.io/videos/ezgif-767ed7843f54ec.mp4",
  "https://mizubyte.github.io/videos/ezgif-767ed7843f54ec.mp4",
  "https://mizubyte.github.io/videos/ezgif-767ed7843f54ec.mp4",
  "https://mizubyte.github.io/videos/ezgif-767ed7843f54ec.mp4",
  "https://mizubyte.github.io/videos/ezgif-767ed7843f54ec.mp4",
  "https://mizubyte.github.io/videos/1.mp4",
  "https://mizubyte.github.io/videos/2.mp4",
  "https://mizubyte.github.io/videos/3.mp4",
  "https://mizubyte.github.io/videos/4.mp4",
  "https://mizubyte.github.io/videos/5.mp4",
  "https://mizubyte.github.io/videos/6.mp4",
  "https://mizubyte.github.io/videos/7.mp4",
  "https://mizubyte.github.io/videos/8.mp4",
  "https://mizubyte.github.io/videos/9.mp4",
  "https://mizubyte.github.io/videos/10.mp4",
  "https://mizubyte.github.io/videos/11.mp4",
  "https://mizubyte.github.io/videos/12.mp4",
  "https://mizubyte.github.io/videos/13.mp4",
  "https://mizubyte.github.io/videos/14.mp4",
  "https://mizubyte.github.io/videos/15.mp4",
  "https://mizubyte.github.io/videos/16.mp4",
  "https://mizubyte.github.io/videos/17.mp4",
  "https://mizubyte.github.io/videos/18.mp4",
  "https://mizubyte.github.io/videos/19.mp4",
  "https://mizubyte.github.io/videos/20.mp4"

];
let mediaElem;
let currentMediaIdx = Math.floor(Math.random() * mediaList.length);
function setMedia(idx) {
  if (mediaElem) {
    if (mediaElem.parentNode) mediaElem.parentNode.removeChild(mediaElem);
    if (mediaElem.pause) mediaElem.pause();
  }
  const src = mediaList[idx];
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
}
setMedia(currentMediaIdx);

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
let textures = twgl.createTextures(gl, {
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

function changeLogoVideo() {
  let nextIdx = Math.floor(Math.random() * mediaList.length);
  // Avoid same video
  if (nextIdx === currentMediaIdx && mediaList.length > 1) {
    nextIdx = (nextIdx + 1) % mediaList.length;
  }
  currentMediaIdx = nextIdx;
  setMedia(currentMediaIdx);
  textures = twgl.createTextures(gl, {
    video: { src: mediaElem, min: gl.LINEAR, wrap: [gl.REPEAT, gl.REPEAT] }
  });
}

window.addEventListener("DOMContentLoaded", (event) => {
  requestAnimationFrame(render);
  const logoDiv = document.querySelector('.logo-top-left');
  if (logoDiv) {
    logoDiv.addEventListener('click', function(e) {
      changeLogoVideo();
    });
    // Right-click hold
    let rightClickHeld = false;
    logoDiv.addEventListener('mousedown', function(e) {
      if (e.button === 2) { // right mouse button
        rightClickHeld = true;
        setLogoSize(true);
      }
    });
    logoDiv.addEventListener('mouseup', function(e) {
      if (rightClickHeld) {
        setLogoSize(false);
        rightClickHeld = false;
      }
    });
    logoDiv.addEventListener('mouseleave', function(e) {
      if (rightClickHeld) {
        setLogoSize(false);
        rightClickHeld = false;
      }
    });
    // Prevent context menu on right click
    logoDiv.addEventListener('contextmenu', function(e) {
      e.preventDefault();
    });
  }
});
