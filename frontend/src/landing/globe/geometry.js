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
