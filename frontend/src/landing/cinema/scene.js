import * as THREE from "three";
import { DESTINATIONS, HUB, ROME } from "../globe/cities.js";
import { arcPoints, facingRotation, toVector } from "../globe/geometry.js";
import { atmosphereMaterial, earthMaterial, gaugeMaterial } from "./materials.js";

const SUN_LAT = -23; // mi-décembre : soleil au zénith du tropique du Capricorne
const EASE = 0.09; // la caméra rattrape l'état du scroll avec un peu d'inertie
const GAUGE_RADIUS = 1.2;

function routeTube(to, radius) {
  const curve = new THREE.CatmullRomCurve3(arcPoints(HUB, to, 48));
  return new THREE.TubeGeometry(curve, 120, radius, 6, false);
}

/** Avion stylisé (une flèche plate), le nez vers +z, posé dans le plan xz. */
function planeGeometry() {
  const s = 0.028;
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([
    0, 0, s, -0.7 * s, 0, -0.6 * s, 0, 0, -0.25 * s,
    0, 0, s, 0, 0, -0.25 * s, 0.7 * s, 0, -0.6 * s,
  ], 3));
  return geometry;
}

/** Fraction visible d'un tube : dessine les premiers segments seulement. */
function reveal(mesh, amount) {
  const count = mesh.geometry.index.count;
  mesh.geometry.setDrawRange(0, Math.floor((count * THREE.MathUtils.clamp(amount, 0, 1)) / 6) * 6);
}

/**
 * Scène du récit : la Terre éclairée par le soleil, la route Tunis → Rome, l'anneau du budget
 * et les routes de toutes les destinations. Elle lit `state` (écrit par le scroll) à chaque image.
 * Lève une erreur si WebGL est indisponible.
 */
export function createScene({ mount, state, interaction, onFrame, onProgress, onReady }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  mount.appendChild(renderer.domElement);
  const canvas = renderer.domElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const globe = new THREE.Group();
  scene.add(globe);

  const manager = new THREE.LoadingManager(onReady, (_url, loaded, total) => onProgress(loaded / total));
  const loader = new THREE.TextureLoader(manager);
  const texture = (file) => {
    const map = loader.load(`/images/${file}`);
    map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return map;
  };
  const textures = {
    day: texture("terre-jour.jpg"),
    night: texture("terre-nuit.jpg"),
    ocean: texture("terre-masque.jpg"),
    clouds: texture("terre-nuages.jpg"),
  };
  textures.clouds.wrapS = THREE.RepeatWrapping;

  const earth = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), earthMaterial(textures));
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.09, 96, 64), atmosphereMaterial());
  globe.add(earth, atmosphere);

  // Villes : Tunis en safran, les destinations en blanc, des zones de clic plus larges.
  const dot = new THREE.SphereGeometry(0.0065, 16, 12);
  const hitGeometry = new THREE.SphereGeometry(0.07, 8, 8);
  const hidden = new THREE.MeshBasicMaterial({ visible: false });
  const hub = new THREE.Mesh(dot, new THREE.MeshBasicMaterial({ color: "#f4b73f" }));
  hub.position.copy(toVector(HUB.lat, HUB.lon, 1.004));
  globe.add(hub);
  const hitTargets = [];
  const cities = new Map();
  DESTINATIONS.forEach((city, index) => {
    const position = toVector(city.lat, city.lon, 1.004);
    const marker = new THREE.Mesh(dot, new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true }));
    marker.position.copy(position);
    const hit = new THREE.Mesh(hitGeometry, hidden);
    hit.position.copy(position);
    hit.userData.city = city.name;
    const route = new THREE.Mesh(routeTube(city, 0.0026), new THREE.MeshBasicMaterial({ color: "#5fd0de", transparent: true }));
    globe.add(marker, hit, route);
    hitTargets.push(hit);
    cities.set(city.name, { city, marker, route, position, delay: index / DESTINATIONS.length });
  });

  // Le vol de la démonstration, dessiné par le scroll, et son avion.
  const flight = new THREE.Mesh(routeTube(ROME, 0.0045), new THREE.MeshBasicMaterial({ color: "#f4b73f" }));
  const flightPath = arcPoints(HUB, ROME, 240);
  const plane = new THREE.Mesh(planeGeometry(), new THREE.MeshBasicMaterial({ color: "#ffffff", side: THREE.DoubleSide }));
  globe.add(flight, plane);

  // Anneau du budget autour de la planète, avec un repère à la limite.
  const gauge = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(GAUGE_RADIUS, 0.006, 8, 360), gaugeMaterial());
  ring.scale.x = -1; // le remplissage part du haut
  ring.rotation.z = -Math.PI / 2; // et tourne dans le sens des aiguilles d'une montre
  const limitMark = new THREE.Mesh(new THREE.SphereGeometry(0.014, 16, 12), new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true }));
  gauge.add(ring, limitMark);
  gauge.rotation.x = -0.28;
  scene.add(gauge);

  // Taille du canvas.
  const size = { w: 1, h: 1 };
  const resize = () => {
    size.w = mount.clientWidth;
    size.h = mount.clientHeight;
    renderer.setSize(size.w, size.h, false);
    camera.aspect = size.w / size.h;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(mount);
  resize();

  // Souris : légère parallaxe partout ; glisser et cliquer quand le globe est interactif.
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let drag = null;
  const onWindowMove = (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  const cityAt = (e) => {
    ndc.set((e.clientX / size.w) * 2 - 1, -(e.clientY / size.h) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObjects(hitTargets)[0]?.object.userData.city;
  };
  const onDown = (e) => {
    if (!interaction.enabled) return;
    drag = { x: e.clientX, y: e.clientY, moved: 0 };
    canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => {
    if (!interaction.enabled) {
      canvas.style.cursor = "";
      return;
    }
    if (!drag) {
      canvas.style.cursor = cityAt(e) ? "pointer" : "grab";
      return;
    }
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    drag = { x: e.clientX, y: e.clientY, moved: drag.moved + Math.abs(dx) + Math.abs(dy) };
    interaction.dragLon -= dx * 0.25;
    interaction.dragLat = THREE.MathUtils.clamp(interaction.dragLat + dy * 0.25, -40, 40);
  };
  const onUp = (e) => {
    if (drag && drag.moved < 6) {
      const city = cityAt(e);
      if (city) interaction.onSelect(city);
    }
    drag = null;
  };
  window.addEventListener("pointermove", onWindowMove);
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);

  // Projection d'un point du globe à l'écran, et s'il est sur la face visible.
  const world = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const toCamera = new THREE.Vector3();
  const project = (local) => {
    world.copy(local);
    globe.localToWorld(world);
    normal.copy(world).sub(globe.position).normalize();
    toCamera.copy(camera.position).sub(world).normalize();
    const facing = normal.dot(toCamera);
    world.project(camera);
    return { x: ((world.x + 1) / 2) * size.w, y: ((1 - world.y) / 2) * size.h, facing };
  };

  const view = { x: state.x, y: state.y, z: state.z, lat: state.lat, lon: state.lon };
  const sun = new THREE.Vector3();
  const basis = new THREE.Matrix4();
  const tangent = new THREE.Vector3();
  const up = new THREE.Vector3();
  const side = new THREE.Vector3();
  let frame = 0;
  let time = 0;

  const tick = () => {
    frame = requestAnimationFrame(tick);
    time += 1 / 60;
    const s = state;
    const selected = cities.get(interaction.selected);

    // Où regarder : l'état du scroll, puis la ville choisie quand le globe devient interactif.
    let lat = s.lat;
    let lon = s.lon;
    if (s.focus > 0 && selected) {
      const focusLat = (selected.city.lat + HUB.lat) / 2 + 3 + interaction.dragLat;
      const focusLon = (selected.city.lon + HUB.lon) / 2 + interaction.dragLon;
      lat += (focusLat - lat) * s.focus;
      lon += (focusLon - lon) * s.focus;
    }
    view.lat += (lat - view.lat) * EASE;
    view.lon += (lon - view.lon) * EASE;
    view.x += (s.x - view.x) * EASE;
    view.y += (s.y - s.intro - view.y) * EASE;
    view.z += (s.z - view.z) * EASE;
    const rotation = facingRotation(view.lat, view.lon);
    globe.rotation.set(rotation.x, rotation.y, 0);
    globe.position.set(view.x, view.y, 0);

    pointer.sx += (pointer.x - pointer.sx) * 0.05;
    pointer.sy += (pointer.y - pointer.sy) * 0.05;
    camera.position.set(pointer.sx * 0.08, -pointer.sy * 0.06, view.z);
    camera.lookAt(pointer.sx * 0.03, -pointer.sy * 0.02, 0);

    sun.copy(toVector(SUN_LAT, s.sunLon)).applyQuaternion(globe.quaternion).normalize();
    earth.material.uniforms.sunDir.value.copy(sun);
    atmosphere.material.uniforms.sunDir.value.copy(sun);
    if (!reducedMotion) earth.material.uniforms.cloudShift.value = time * 0.0012;

    hub.scale.setScalar(1.4 + (reducedMotion ? 0 : Math.sin(time * 3) * 0.3));

    reveal(flight, s.arc);
    flight.visible = s.arc > 0;
    plane.visible = s.arc > 0.01 && s.arc < 0.99;
    if (plane.visible) {
      const i = Math.min(Math.floor(s.arc * (flightPath.length - 2)), flightPath.length - 2);
      const here = flightPath[i];
      up.copy(here).normalize();
      tangent.copy(flightPath[i + 1]).sub(here).normalize();
      side.crossVectors(up, tangent).normalize();
      basis.makeBasis(side, up, tangent);
      plane.quaternion.setFromRotationMatrix(basis);
      plane.position.copy(here);
    }

    for (const [name, entry] of cities) {
      const isSelected = s.focus > 0.5 && name === interaction.selected;
      const isRome = name === ROME.name;
      entry.marker.material.opacity = Math.max(s.markers, isRome ? s.labels : 0);
      entry.marker.scale.setScalar(isSelected ? 1.9 : 1);
      entry.marker.material.color.set(isSelected ? "#f4b73f" : "#ffffff");
      const shown = THREE.MathUtils.clamp((s.fan - entry.delay * 0.5) * 2, 0, 1);
      reveal(entry.route, shown);
      entry.route.visible = shown > 0;
      entry.route.material.color.set(isSelected ? "#f4b73f" : "#5fd0de");
      entry.route.material.opacity = isSelected ? 1 : 0.55;
    }

    const uniforms = ring.material.uniforms;
    uniforms.fill.value = s.fill;
    uniforms.limit.value = s.limit;
    uniforms.opacity.value = s.ring;
    gauge.visible = s.ring > 0;
    gauge.position.copy(globe.position);
    const limitAngle = Math.PI / 2 - s.limit * Math.PI * 2;
    limitMark.position.set(Math.cos(limitAngle) * GAUGE_RADIUS, Math.sin(limitAngle) * GAUGE_RADIUS, 0);
    limitMark.material.opacity = s.ring;

    onFrame({
      size,
      tunis: project(hub.position),
      rome: project(cities.get(ROME.name).position),
      interactive: s.focus > 0.5,
    });
    interaction.enabled = s.focus > 0.5;
    renderer.render(scene, camera);
  };
  tick();

  return function dispose() {
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    window.removeEventListener("pointermove", onWindowMove);
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointermove", onMove);
    canvas.removeEventListener("pointerup", onUp);
    scene.traverse((object) => {
      object.geometry?.dispose();
      object.material?.dispose?.();
    });
    Object.values(textures).forEach((map) => map.dispose());
    renderer.dispose();
    canvas.remove();
  };
}
