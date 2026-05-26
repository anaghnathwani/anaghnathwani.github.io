import { useEffect, useRef } from 'react';
import styles from './ShaderHero.module.css';

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

/* Domain-warped fbm shader — dark mode: deep-space aurora, light mode: soft caustics */
const FRAG = `
precision mediump float;

uniform float u_time;
uniform vec2  u_res;
uniform vec2  u_mouse;
uniform float u_dark;

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(rand(i),              rand(i + vec2(1.0, 0.0)), f.x),
    mix(rand(i + vec2(0.0,1.0)), rand(i + vec2(1.0,1.0)), f.x),
    f.y
  );
}

const mat2 M = mat2(1.6, 1.2, -1.2, 1.6);

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * vnoise(p);
    p  = M * p;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv  = gl_FragCoord.xy / u_res;
  float t  = u_time * 0.16;
  float ar = u_res.x / u_res.y;

  vec2 p     = uv * vec2(ar, 1.0);
  vec2 mouse = u_mouse * vec2(ar, 1.0);

  /* mouse ripple */
  float md    = length(p - mouse);
  float mwave = exp(-md * 3.5) * 0.22;

  /* double domain warp */
  vec2 q = vec2(fbm(p + t),             fbm(p + vec2(3.7, 2.1) + t));
  vec2 r = vec2(
    fbm(p + 2.8 * q + vec2(1.7,  9.2) + 0.14 * t),
    fbm(p + 2.8 * q + vec2(8.3,  2.8) + 0.11 * t)
  );
  float f = fbm(p + 2.8 * r + mwave);

  vec3 col;

  if (u_dark > 0.5) {
    /* ── dark: aurora borealis ── */
    vec3 space   = vec3(0.028, 0.020, 0.065);
    vec3 dPurple = vec3(0.20,  0.04,  0.48);
    vec3 violet  = vec3(0.50,  0.13,  0.90);
    vec3 blueV   = vec3(0.08,  0.20,  0.78);
    vec3 pink    = vec3(0.80,  0.12,  0.70);
    vec3 teal    = vec3(0.04,  0.48,  0.72);

    col = space;
    col = mix(col, dPurple, smoothstep(0.08, 0.40, f));
    col = mix(col, violet,  smoothstep(0.28, 0.62, f));
    col = mix(col, blueV,   smoothstep(0.50, 0.80, length(q)));
    col = mix(col, pink,    smoothstep(0.60, 0.88, length(r)) * 0.32);

    /* aurora band mid-screen */
    float band  = smoothstep(0.30, 0.60, uv.y) * (1.0 - smoothstep(0.55, 0.95, uv.y));
    float wave  = sin(p.x * 3.2 + t * 2.1 + fbm(p * 0.5) * 5.0) * 0.5 + 0.5;
    col = mix(col, teal,   band * wave * 0.55);
    col = mix(col, violet, band * (1.0 - wave) * 0.38);

    /* right-side glow (away from text) */
    float sideGlow = smoothstep(0.4, 1.0, uv.x) * smoothstep(0.0, 0.6, uv.y);
    col += violet * sideGlow * 0.18;

    /* mouse bloom */
    col += vec3(0.65, 0.24, 0.96) * exp(-md * 4.0) * 0.50;

    /* twinkling stars */
    vec2 sg = floor(uv * 140.0);
    float sr = rand(sg);
    float blink = sin(u_time * (1.2 + sr * 3.5) + sr * 6.28) * 0.5 + 0.5;
    col += vec3(0.85, 0.85, 1.0) * step(0.962, sr) * blink * 0.90;

    col = pow(col, vec3(0.78));

  } else {
    /* ── light: soft caustic glow ── */
    vec3 white    = vec3(1.00, 0.99, 1.00);
    vec3 lavender = vec3(0.93, 0.86, 1.00);
    vec3 softBlue = vec3(0.85, 0.87, 1.00);
    vec3 pinkT    = vec3(1.00, 0.87, 0.96);

    col = white;
    col = mix(col, lavender, f * 0.48);
    col = mix(col, softBlue, length(q) * 0.20);
    col = mix(col, pinkT,    length(r) * 0.12);

    /* top light ray */
    float ray = sin(uv.x * 3.14159) * pow(max(1.0 - uv.y, 0.0), 1.3) * 0.5;
    col = mix(col, vec3(0.78, 0.62, 1.00), ray * 0.10);

    /* right glow */
    float sg2 = smoothstep(0.45, 1.0, uv.x) * 0.12;
    col = mix(col, lavender, sg2);

    col = clamp(col, vec3(0.92), vec3(1.0));
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function ShaderHero() {
  const canvasRef  = useRef(null);
  const frameRef   = useRef(null);
  const visibleRef = useRef(true);
  const mouseRef   = useRef([0.72, 0.60]); // normalized, starts top-right
  const startRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    });
    if (!gl) return;

    const mkShader = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const prog = gl.createProgram();
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime  = gl.getUniformLocation(prog, 'u_time');
    const uRes   = gl.getUniformLocation(prog, 'u_res');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');
    const uDark  = gl.getUniformLocation(prog, 'u_dark');
    gl.uniform1f(uDark, isDark ? 1 : 0);

    const pr = Math.min(window.devicePixelRatio ?? 1, 2);

    const resize = () => {
      canvas.width  = canvas.offsetWidth  * pr;
      canvas.height = canvas.offsetHeight * pr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    startRef.current = performance.now();

    const render = (now) => {
      frameRef.current = requestAnimationFrame(render);
      if (!visibleRef.current) return;
      gl.uniform1f(uTime,  (now - startRef.current) / 1000);
      gl.uniform2f(uMouse, mouseRef.current[0], mouseRef.current[1]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    frameRef.current = requestAnimationFrame(render);

    const io = new IntersectionObserver(([e]) => { visibleRef.current = e.isIntersecting; });
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const onMove = (e) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = [
        (e.clientX - rect.left)  / rect.width,
        1 - (e.clientY - rect.top) / rect.height,
      ];
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
