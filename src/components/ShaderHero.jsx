import { useEffect, useRef } from 'react';
import styles from './ShaderHero.module.css';

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

/* Richer domain-warped aurora — designed to look beautiful through a glass card */
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
    mix(rand(i),                 rand(i + vec2(1.0, 0.0)), f.x),
    mix(rand(i + vec2(0.0, 1.0)), rand(i + vec2(1.0, 1.0)), f.x),
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
  float t  = u_time * 0.14;
  float ar = u_res.x / u_res.y;

  vec2 p     = uv * vec2(ar, 1.0);
  vec2 mouse = u_mouse * vec2(ar, 1.0);

  float md    = length(p - mouse);
  float mwave = exp(-md * 3.2) * 0.28;

  /* double domain warp */
  vec2 q = vec2(fbm(p + t),                    fbm(p + vec2(3.8, 2.3) + t));
  vec2 r = vec2(
    fbm(p + 3.0 * q + vec2(1.7, 9.2) + 0.14 * t),
    fbm(p + 3.0 * q + vec2(8.3, 2.8) + 0.11 * t)
  );
  float f = fbm(p + 3.0 * r + mwave);

  vec3 col;

  if (u_dark > 0.5) {
    /* dark: rich deep-space aurora, vivid enough to show through glass */
    vec3 ink     = vec3(0.02, 0.02, 0.06);
    vec3 dPurple = vec3(0.28, 0.06, 0.60);
    vec3 violet  = vec3(0.60, 0.16, 1.00);
    vec3 indigo  = vec3(0.18, 0.28, 0.95);
    vec3 pink    = vec3(0.90, 0.16, 0.76);
    vec3 teal    = vec3(0.05, 0.60, 0.82);

    col = ink;
    col = mix(col, dPurple, smoothstep(0.05, 0.38, f));
    col = mix(col, violet,  smoothstep(0.26, 0.60, f));
    col = mix(col, indigo,  smoothstep(0.50, 0.82, length(q)));
    col = mix(col, pink,    smoothstep(0.62, 0.90, length(r)) * 0.40);

    /* horizontal aurora ribbon */
    float band = smoothstep(0.28, 0.58, uv.y) * (1.0 - smoothstep(0.52, 0.92, uv.y));
    float wave = sin(p.x * 3.4 + t * 2.2 + fbm(p * 0.4) * 6.0) * 0.5 + 0.5;
    col = mix(col, teal,   band * wave * 0.65);
    col = mix(col, violet, band * (1.0 - wave) * 0.45);

    /* right-side glow (behind where glass card won't cover) */
    float rGlow = smoothstep(0.42, 1.0, uv.x) * smoothstep(0.10, 0.70, uv.y);
    col += violet * rGlow * 0.24;
    col += indigo * rGlow * 0.14;

    /* mouse bloom */
    float bloom = exp(-md * 3.8);
    col += vec3(0.70, 0.30, 1.00) * bloom * 0.55;

    /* soft twinkling stars */
    vec2 sg    = floor(uv * 160.0);
    float sr   = rand(sg);
    float blink = sin(u_time * (1.2 + sr * 3.8) + sr * 6.28) * 0.5 + 0.5;
    float starA = step(0.960, sr) * blink;
    col += vec3(0.85, 0.85, 1.00) * starA;

    /* subtle vignette to focus on card area */
    vec2 vig = uv * 2.0 - 1.0;
    col *= 1.0 - dot(vig * vec2(0.22, 0.35), vig * vec2(0.22, 0.35));

    col = pow(max(col, vec3(0.0)), vec3(0.80));

  } else {
    /* light: painterly pastel gradients — soft but visible behind glass */
    vec3 pearl   = vec3(0.99, 0.97, 1.00);
    vec3 lavBlue = vec3(0.82, 0.82, 1.00);
    vec3 lilac   = vec3(0.88, 0.72, 1.00);
    vec3 roseQ   = vec3(1.00, 0.78, 0.92);
    vec3 skyBlue = vec3(0.72, 0.86, 1.00);

    col = pearl;
    col = mix(col, lavBlue, f * 0.70);
    col = mix(col, lilac,   length(q) * 0.50);
    col = mix(col, roseQ,   length(r) * 0.35);
    col = mix(col, skyBlue, smoothstep(0.5, 0.9, f) * 0.40);

    /* top sweep of light */
    float ray = sin(uv.x * 3.14159) * pow(max(1.0 - uv.y, 0.0), 1.1) * 0.6;
    col = mix(col, vec3(0.72, 0.55, 1.00), ray * 0.18);

    /* mouse bloom */
    col = mix(col, lilac, exp(-md * 3.0) * 0.22);

    col = clamp(col, vec3(0.80), vec3(1.0));
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

export default function ShaderHero() {
  const canvasRef  = useRef(null);
  const frameRef   = useRef(null);
  const visibleRef = useRef(true);
  const mouseRef   = useRef([0.75, 0.55]);
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
