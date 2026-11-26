import * as THREE from "three";

/** Couleur hexadécimale en vec3 sRGB, sans conversion (les shaders travaillent en sRGB). */
function srgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export const PALETTE = {
  night: srgb("#132238"),
  lagoon: srgb("#1b8a9a"),
  glow: srgb("#5fd0de"),
  mist: srgb("#eef4f5"),
  saffron: srgb("#f4b73f"),
};

const SHARED_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

/**
 * La Terre : carte du jour, lumières des villes côté nuit (en safran), nuages,
 * reflet du soleil sur les océans et liseré d'atmosphère.
 */
export function earthMaterial(textures) {
  return new THREE.ShaderMaterial({
    uniforms: {
      dayMap: { value: textures.day },
      nightMap: { value: textures.night },
      oceanMap: { value: textures.ocean },
      cloudMap: { value: textures.clouds },
      sunDir: { value: new THREE.Vector3(1, 0, 0) },
      cloudShift: { value: 0 },
      lagoon: { value: PALETTE.lagoon },
      glow: { value: PALETTE.glow },
      saffron: { value: PALETTE.saffron },
      night: { value: PALETTE.night },
    },
    vertexShader: SHARED_VERTEX,
    fragmentShader: /* glsl */ `
      uniform sampler2D dayMap, nightMap, oceanMap, cloudMap;
      uniform vec3 sunDir, lagoon, glow, saffron, night;
      uniform float cloudShift;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec3 n = normalize(vNormal);
        float sun = dot(n, sunDir);
        float day = smoothstep(-0.1, 0.25, sun);
        float ocean = texture2D(oceanMap, vUv).r;
        float clouds = texture2D(cloudMap, vUv + vec2(cloudShift, 0.0)).r;

        vec3 albedo = texture2D(dayMap, vUv).rgb;
        albedo = mix(albedo, albedo * 0.55 + lagoon * 0.3, ocean * 0.7);
        vec3 lit = albedo * (0.06 + 1.15 * max(sun, 0.0));
        lit = mix(lit, vec3(0.94, 0.97, 1.0) * (0.08 + max(sun, 0.0)), clouds * 0.8);
        vec3 halfway = normalize(sunDir + vView);
        lit += vec3(1.0, 0.93, 0.8) * pow(max(dot(n, halfway), 0.0), 70.0) * ocean * (1.0 - clouds) * 0.8;

        vec3 lights = pow(texture2D(nightMap, vUv).rgb, vec3(1.5)) * saffron * 2.6 * (1.0 - clouds * 0.75);
        vec3 dark = night * 0.28 + lights;

        vec3 color = mix(dark, lit, day);
        color += saffron * 0.07 * exp(-pow(sun * 10.0, 2.0));
        float rim = pow(1.0 - max(dot(n, vView), 0.0), 2.6);
        color += glow * rim * (0.12 + 0.8 * smoothstep(-0.3, 0.6, sun));
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });
}

/** Halo bleu autour de la planète, plus fort du côté éclairé. */
export function atmosphereMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { sunDir: { value: new THREE.Vector3(1, 0, 0) }, glow: { value: PALETTE.glow }, saffron: { value: PALETTE.saffron } },
    vertexShader: SHARED_VERTEX,
    fragmentShader: /* glsl */ `
      uniform vec3 sunDir, glow, saffron;
      varying vec3 vNormal;
      varying vec3 vView;
      void main() {
        vec3 n = normalize(vNormal);
        float edge = smoothstep(0.0, 0.42, -dot(n, vView));
        float lit = smoothstep(-0.5, 0.7, dot(n, sunDir));
        vec3 color = mix(glow, saffron, 0.25 * (1.0 - lit));
        gl_FragColor = vec4(color, pow(edge, 2.2) * (0.25 + 0.75 * lit));
      }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
}

/**
 * Anneau-jauge du budget. `fill` et `limit` sont des fractions du tour :
 * sous la limite en lagon clair, au-delà en safran, le reste en piste discrète.
 */
export function gaugeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      fill: { value: 0 },
      limit: { value: 0.5 },
      opacity: { value: 0 },
      ok: { value: PALETTE.glow },
      over: { value: PALETTE.saffron },
      track: { value: PALETTE.mist },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float fill, limit, opacity;
      uniform vec3 ok, over, track;
      varying vec2 vUv;
      void main() {
        float a = vUv.x;
        vec3 color = a < limit ? ok : over;
        float alpha = a < fill ? 1.0 : 0.13;
        if (a >= fill) color = track;
        gl_FragColor = vec4(color, alpha * opacity);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
}
