// Hero background: a small WebGL1 fragment shader that fakes gravitational
// lensing of a starfield around a black hole, a sketch of where Project V is
// heading. It pauses off-screen, renders one still frame for reduced motion,
// and leaves the CSS gradient fallback in place if WebGL is unavailable.
(() => {
  'use strict';
  const canvas = document.querySelector('[data-hero-canvas]');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return;

  const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

  const FRAG = `
precision highp float;
uniform vec2 uRes;
uniform vec2 uCenter;   // lens centre in pixels
uniform float uRadius;  // horizon radius in pixels
uniform float uTime;
uniform vec2 uTilt;     // pointer parallax, -1..1

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

float stars(vec2 p, float scale, float density) {
  vec2 g = p * scale;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float h = hash(id);
  vec2 o = vec2(hash(id + 1.7), hash(id + 9.2)) - 0.5;
  float d = length(f - o * 0.7);
  float on = step(1.0 - density, h);
  float tw = 0.65 + 0.35 * sin(uTime * (1.0 + h * 2.0) + h * 40.0);
  return on * tw * (1.0 - smoothstep(0.0, 0.09, d)) * (0.4 + 0.6 * hash(id + 3.3));
}

void main() {
  float unit = uRes.y;
  vec2 p = (gl_FragCoord.xy - uCenter) / unit;
  float rs = uRadius / unit;
  float r = length(p);
  vec2 dir = p / max(r, 1e-4);

  // Deflect the sample point towards the lens: strong near the photon sphere, fading with distance.
  float bend = (rs * rs * 2.2) / max(r - rs * 0.2, rs * 0.6);
  vec2 q = p - dir * bend;
  q += uTilt * 0.02 + vec2(uTime * 0.004, 0.0);

  vec3 col = vec3(0.0);
  col += stars(q, 26.0, 0.10) * vec3(0.95, 0.93, 1.0);
  col += stars(q + 3.1, 48.0, 0.12) * vec3(0.75, 0.82, 1.0) * 0.8;
  col += stars(q + 7.7, 90.0, 0.16) * vec3(1.0, 0.85, 0.75) * 0.55;

  // Faint nebula tint.
  col += vec3(0.05, 0.03, 0.09) * (1.0 - smoothstep(0.0, 1.4, length(p + vec2(0.35, 0.15))));

  // Thin accretion disk seen almost edge-on, lensed over the top of the hole.
  float tilt = -0.32;
  vec2 dp = vec2(p.x * cos(tilt) - p.y * sin(tilt), p.x * sin(tilt) + p.y * cos(tilt));
  float disk = exp(-pow(dp.y / (rs * 0.08), 2.0)) * (1.0 - smoothstep(rs * 1.6, rs * 5.5, abs(dp.x))) * step(rs * 1.05, r);
  float swirl = 0.75 + 0.25 * sin(dp.x / rs * 6.0 - uTime * 1.6);
  col += vec3(1.0, 0.52, 0.2) * disk * swirl * 0.9;

  // Photon ring and soft glow.
  float ring = exp(-pow((r - rs * 1.32) / (rs * 0.07), 2.0));
  float glow = exp(-pow((r - rs * 1.3) / (rs * 0.9), 2.0));
  col += vec3(1.0, 0.6, 0.28) * ring * 1.15 + vec3(1.0, 0.45, 0.18) * glow * 0.16;

  // Event horizon.
  col *= smoothstep(rs * 0.98, rs * 1.06, r);

  gl_FragColor = vec4(col, 1.0);
}`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  // Full-screen triangle.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = Object.fromEntries(['uRes', 'uCenter', 'uRadius', 'uTime', 'uTilt'].map((n) => [n, gl.getUniformLocation(prog, n)]));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  let running = false;
  let visible = true;
  let raf = 0;
  const t0 = performance.now();

  function resize() {
    // Cap the backing resolution: the effect is soft, so full DPR is wasted fill-rate.
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    const wide = canvas.clientWidth >= 860;
    // Lens sits right of the copy on desktop, top-right on mobile (y is bottom-up in GL).
    const cx = wide ? 0.74 : 0.9;
    const cy = wide ? 0.48 : 0.93;
    gl.uniform2f(u.uRes, w, h);
    gl.uniform2f(u.uCenter, w * cx, h * cy);
    gl.uniform1f(u.uRadius, Math.min(w, h) * (wide ? 0.085 : 0.07));
  }

  function frame(now) {
    tilt.x += (tilt.tx - tilt.x) * 0.05;
    tilt.y += (tilt.ty - tilt.y) * 0.05;
    gl.uniform1f(u.uTime, 12 + (now - t0) / 1000); // start mid-animation so the still frame looks settled
    gl.uniform2f(u.uTilt, tilt.x, tilt.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (running) raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduceMotion || !visible || document.hidden) return;
    running = true;
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  resize();
  frame(t0); // one still frame immediately (also the reduced-motion frame)
  canvas.setAttribute('data-ready', '');
  start();

  new ResizeObserver(() => { resize(); if (!running) frame(performance.now()); }).observe(canvas);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  if (!reduceMotion) {
    addEventListener('pointermove', (e) => {
      tilt.tx = (e.clientX / innerWidth) * 2 - 1;
      tilt.ty = (e.clientY / innerHeight) * 2 - 1;
    }, { passive: true });
  }
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); stop(); canvas.removeAttribute('data-ready'); });
})();
