import { useEffect, useRef } from "react";
import * as THREE from "three";
import { DESTINATIONS, HUB } from "./cities.js";
import { arcPoints, facingRotation, landPoints, toVector } from "./geometry.js";

const COLORS = { sphere: "#1b2f4b", land: "#1b8a9a", route: "#3fb2c2", selected: "#f4b73f", city: "#ffffff" };
const REST_VIEW = facingRotation(44, 10); // Europe et Méditerranée face au visiteur
const IDLE_SPIN = 0.0006; // rad / image quand personne ne touche le globe
const DRAG_SPEED = 0.005;

function lineMaterial(color, opacity) {
  return new THREE.LineBasicMaterial({ color, transparent: true, opacity });
}

/**
 * Globe WebGL : les terres en points, Tunis et les 12 villes, un arc par vol.
 * Glisser pour tourner, cliquer (ou toucher) une ville pour la choisir.
 * Appelle onUnsupported() si le navigateur n'a pas WebGL.
 */
export default function Globe({ selected, onSelect, onUnsupported }) {
  const mountRef = useRef(null);
  const selectedRef = useRef(selected);
  const onSelectRef = useRef(onSelect);
  const sceneApi = useRef(null);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const mount = mountRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      onUnsupported?.();
      return undefined;
    }
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 3.9);

    const globe = new THREE.Group();
    globe.rotation.set(REST_VIEW.x, REST_VIEW.y, 0);
    scene.add(globe);
    globe.add(new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshBasicMaterial({ color: COLORS.sphere })
    ));

    // Terres : lues dans la carte des océans une fois l'image chargée.
    const mask = new Image();
    mask.onload = () => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(landPoints(mask), 3));
      globe.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: COLORS.land, size: 0.014 })));
    };
    mask.src = "/images/terre-masque.jpg";

    // Villes, zones de clic élargies et arcs depuis Tunis.
    const hitTargets = [];
    const markers = new Map();
    const arcs = new Map();
    const dotGeometry = new THREE.SphereGeometry(0.014, 16, 16);
    const hitGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const hidden = new THREE.MeshBasicMaterial({ visible: false });
    const hub = new THREE.Mesh(dotGeometry, new THREE.MeshBasicMaterial({ color: COLORS.selected }));
    hub.position.copy(toVector(HUB.lat, HUB.lon, 1.004));
    hub.scale.setScalar(1.4);
    globe.add(hub);
    for (const city of DESTINATIONS) {
      const position = toVector(city.lat, city.lon, 1.004);
      const marker = new THREE.Mesh(dotGeometry, new THREE.MeshBasicMaterial({ color: COLORS.city }));
      marker.position.copy(position);
      const hit = new THREE.Mesh(hitGeometry, hidden);
      hit.position.copy(position);
      hit.userData.city = city.name;
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(arcPoints(HUB, city)),
        lineMaterial(COLORS.route, 0.55)
      );
      globe.add(marker, hit, line);
      hitTargets.push(hit);
      markers.set(city.name, marker);
      arcs.set(city.name, line);
    }

    // Petit avion (un point) qui parcourt l'arc de la ville choisie.
    const plane = new THREE.Mesh(dotGeometry, new THREE.MeshBasicMaterial({ color: COLORS.selected }));
    plane.visible = false;
    globe.add(plane);

    let target = null; // rotation visée quand une ville est choisie
    function highlight(name) {
      for (const [city, marker] of markers) {
        const on = city === name;
        marker.material.color.set(on ? COLORS.selected : COLORS.city);
        marker.scale.setScalar(on ? 1.8 : 1);
        const { material } = arcs.get(city);
        material.color.set(on ? COLORS.selected : COLORS.route);
        material.opacity = on ? 1 : 0.55;
      }
      const city = DESTINATIONS.find((c) => c.name === name);
      plane.visible = Boolean(city);
      if (city) {
        // On vise le milieu du trajet pour voir Tunis et la ville ensemble.
        target = facingRotation((city.lat + HUB.lat) / 2 + 4, (city.lon + HUB.lon) / 2);
      }
    }
    sceneApi.current = { highlight };
    highlight(selectedRef.current);

    // Taille : le canvas suit son conteneur.
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    // Glisser pour tourner, cliquer pour choisir.
    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    let drag = null;
    const cityAt = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(hitTargets)[0]?.object.userData.city;
    };
    const onDown = (e) => {
      drag = { x: e.clientX, y: e.clientY, moved: 0 };
      renderer.domElement.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (!drag) {
        renderer.domElement.style.cursor = cityAt(e) ? "pointer" : "grab";
        return;
      }
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag = { x: e.clientX, y: e.clientY, moved: drag.moved + Math.abs(dx) + Math.abs(dy) };
      target = null;
      globe.rotation.y += dx * DRAG_SPEED;
      globe.rotation.x = THREE.MathUtils.clamp(globe.rotation.x + dy * DRAG_SPEED, -0.4, 1.3);
    };
    const onUp = (e) => {
      if (drag && drag.moved < 6) {
        const city = cityAt(e);
        if (city) onSelectRef.current(city);
      }
      drag = null;
    };
    const canvas = renderer.domElement;
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);

    // Animation, en pause quand le globe n'est pas à l'écran.
    let visible = true;
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    visibility.observe(mount);
    let frame = 0;
    let progress = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (!visible) return;
      if (target) {
        globe.rotation.x += (target.x - globe.rotation.x) * 0.06;
        globe.rotation.y += (target.y - globe.rotation.y) * 0.06;
      } else if (!drag && !reducedMotion) {
        globe.rotation.y += IDLE_SPIN;
      }
      if (plane.visible) {
        const points = arcs.get(selectedRef.current).geometry.attributes.position;
        progress = (progress + (reducedMotion ? 0 : 0.006)) % 1;
        const i = Math.floor(progress * (points.count - 1));
        plane.position.fromBufferAttribute(points, reducedMotion ? points.count - 1 : i);
      }
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      scene.traverse((object) => {
        object.geometry?.dispose();
        object.material?.dispose?.();
      });
      renderer.dispose();
      canvas.remove();
      sceneApi.current = null;
    };
  }, [onUnsupported]);

  useEffect(() => {
    selectedRef.current = selected;
    sceneApi.current?.highlight(selected);
  }, [selected]);

  return <div ref={mountRef} className="globe" aria-hidden="true" />;
}
