import * as THREE from "three";

const DEG = Math.PI / 180;

/** Point de la sphère de rayon `radius` pour une latitude et une longitude en degrés. */
export function toVector(lat, lon, radius = 1) {
  const phi = (90 - lat) * DEG;
  const theta = (lon + 180) * DEG;
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/** Rotation du globe (x, y) qui amène une latitude/longitude face à la caméra (+z). */
export function facingRotation(lat, lon) {
  const theta = (lon + 180) * DEG;
  return { x: lat * DEG, y: Math.atan2(Math.cos(theta), Math.sin(theta)) };
}

/** Arc de grand cercle entre deux points, soulevé au-dessus de la surface. */
export function arcPoints(from, to, segments = 64) {
  const start = toVector(from.lat, from.lon);
  const end = toVector(to.lat, to.lon);
  const lift = 0.06 + start.distanceTo(end) * 0.35;
  const points = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const point = start.clone().lerp(end, t).normalize();
    points.push(point.multiplyScalar(1 + Math.sin(Math.PI * t) * lift));
  }
  return points;
}

/**
 * Points des terres émergées, lus dans la carte des océans (océans clairs, terres sombres).
 * Espacement à peu près constant : moins de points par ligne près des pôles.
 */
export function landPoints(image, step = 1.1) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const positions = [];
  for (let lat = -80; lat <= 84; lat += step) {
    const lonStep = step / Math.max(Math.cos(lat * DEG), 0.2);
    for (let lon = -180; lon < 180; lon += lonStep) {
      const x = Math.floor(((lon + 180) / 360) * (width - 1));
      const y = Math.floor(((90 - lat) / 180) * (height - 1));
      if (data[(y * width + x) * 4] < 128) {
        const v = toVector(lat, lon, 1.002);
        positions.push(v.x, v.y, v.z);
      }
    }
  }
  return new Float32Array(positions);
}
