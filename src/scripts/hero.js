// Hero background: a WebGL1 fragment shader sketching an Interstellar-style
// wormhole, a spherical mouth that connects two distant points in space.
//
//  - Outside the mouth we see OUR sky (cool, sparse stars and a faint galactic
//    band). Light passing close to the throat is bent, so the local sky is
//    lensed into an Einstein ring around the rim.
//  - Inside the mouth we see the OTHER END: a different region of space with a
//    warm spiral galaxy. The whole far sky is compressed towards the rim, the
//    way a wormhole squeezes an entire hemisphere into a sphere.
//
// It pauses off-screen and in background tabs, draws one still frame for
// reduced motion, and leaves the CSS gradient fallback in place without WebGL.
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
uniform vec2 uCenter;   // wormhole mouth centre, pixels
uniform float uRadius;  // mouth radius, pixels
uniform float uTime;
uniform vec2 uTilt;     // pointer parallax, -1..1

const float PI = 3.14159265;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return v;
}

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

// Our side of the wormhole: cool, sparse, with a faint galactic band.
vec3 localSky(vec2 q) {
  vec3 c = vec3(0.0);
  c += stars(q, 26.0, 0.10) * vec3(0.92, 0.95, 1.0);
  c += stars(q + 3.1, 48.0, 0.12) * vec3(0.72, 0.82, 1.0) * 0.8;
  c += stars(q + 7.7, 90.0, 0.16) * vec3(0.85, 0.88, 1.0) * 0.5;
  float band = exp(-pow((q.y + q.x * 0.4 + 0.08) / 0.2, 2.0));
  c += vec3(0.08, 0.10, 0.20) * band * fbm(q * 3.0 + 2.0) * 1.2;
  c += stars(q + 1.3, 160.0, 0.30) * band * 0.5;
  return c;
}

// The far side: another region of space, dominated by a warm spiral galaxy.
vec3 remoteSky(vec2 u) {
  vec3 c = vec3(0.025, 0.012, 0.04);
  c += vec3(0.30, 0.10, 0.38) * pow(fbm(u * 1.6 + 5.0), 2.2) * 0.9;   // nebula
  vec2 g = u - vec2(0.03, -0.02);
  float ca = cos(0.55), sa = sin(0.55);
  g = vec2(ca * g.x - sa * g.y, sa * g.x + ca * g.y);
  g.y *= 2.1;                                                          // inclined disk
  float r = length(g);
  float a = atan(g.y, g.x);
  float arms = 0.5 + 0.5 * cos(2.0 * (a - log(r + 0.02) * 2.4) - uTime * 0.12);
  float disk = exp(-r * 2.7);
  c += vec3(1.0, 0.58, 0.28) * disk * (0.25 + 0.75 * arms) * (0.55 + 0.7 * fbm(g * 7.0));
  c += vec3(1.0, 0.86, 0.62) * exp(-r * r * 140.0) * 1.5;             // bright core
  c += stars(u, 34.0, 0.20) * vec3(1.0, 0.9, 0.8);
  c += stars(u + 2.0, 80.0, 0.28) * vec3(1.0, 0.8, 0.7) * 0.7;
  return c;
}

void main() {
  float unit = uRes.y;
  vec2 p = (gl_FragCoord.xy - uCenter) / unit;
  float R = uRadius / unit;
  float r = length(p);
  vec2 dir = p / max(r, 1e-4);
  vec2 drift = uTilt * 0.02 + vec2(uTime * 0.004, 0.0);

  vec3 outside = vec3(0.0);
  vec3 inside = vec3(0.0);

  if (r > R * 0.97) {
    // Thin-lens mapping: the image at radius r comes from source radius r - k*R^2/r.
    // At the rim the source collapses to the point behind the mouth -> Einstein ring.
    float src = r - 0.92 * R * R / r;
    outside = localSky(dir * src + drift);
    // Tangential stretching near the ring brightens the lensed stars slightly.
    outside *= 1.0 + 0.6 * exp(-pow((r - R) / (R * 0.18), 2.0));
  }

  if (r < R * 1.03) {
    // Fisheye into the far side: the far sky's angular radius runs to infinity at the rim.
    float s = clamp(r / R, 0.0, 0.999);
    float far = tan(s * PI * 0.48) * 0.32;
    // The far side turns slowly instead of drifting, so its galaxy always stays in view.
    float ang = uTime * 0.02;
    vec2 v = dir * far;
    v = vec2(cos(ang) * v.x - sin(ang) * v.y, sin(ang) * v.x + cos(ang) * v.y);
    inside = remoteSky(v - uTilt * 0.04);
    // Treat the mouth as a glassy sphere: soft limb darkening plus a faint highlight.
    float z = sqrt(max(0.0, 1.0 - s * s));
    inside *= 0.55 + 0.45 * z;
    vec3 n = vec3(p / R, z);
    float spec = pow(max(dot(n, normalize(vec3(-0.45, 0.55, 0.7))), 0.0), 48.0);
    inside += vec3(0.85, 0.9, 1.0) * spec * 0.22;
  }

  float edge = smoothstep(R * 0.985, R * 1.015, r);
  vec3 col = mix(inside, outside, edge);

  // Rim: the thin, bright ring of light skimming the throat.
  col += vec3(0.78, 0.84, 1.0) * exp(-pow((r - R) / (R * 0.02), 2.0)) * 0.28;
  col += vec3(0.45, 0.52, 0.85) * exp(-pow((r - R) / (R * 0.22), 2.0)) * 0.07;

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
    const dpr = Math.min(devicePixelRatio || 1, 1.25);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    const wide = canvas.clientWidth >= 860;
    // Mouth sits right of the copy on desktop, top-right on mobile (y is bottom-up in GL).
    const cx = wide ? 0.74 : 0.86;
    const cy = wide ? 0.5 : 0.9;
    gl.uniform2f(u.uRes, w, h);
    gl.uniform2f(u.uCenter, w * cx, h * cy);
    gl.uniform1f(u.uRadius, Math.min(w, h) * (wide ? 0.16 : 0.09));
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
