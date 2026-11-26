import gsap from "gsap";
import { SAMPLE_TRIP } from "../../content/sampleTrip.js";
import { ROME } from "../globe/cities.js";

/** Les chapitres du récit et leur hauteur de scroll, en hauteurs d'écran (vh). */
export const CHAPTERS = [
  { id: "depart", vh: 100, label: "Départ" },
  { id: "agents", vh: 150, label: "Les agents" },
  { id: "demande", vh: 120, label: "La demande" },
  { id: "planificateur", vh: 170, label: "01 Planificateur" },
  { id: "programme", vh: 230, label: "02 Programme" },
  { id: "budget", vh: 250, label: "03 Budget" },
  { id: "destinations", vh: 170, label: "Destinations" },
  { id: "fin", vh: 130, label: "Départ" },
];

export const chapterHeight = (id) => CHAPTERS.find((c) => c.id === id).vh;

// Un chapitre est actif quand il traverse le milieu de l'écran : de son début - 50vh à sa fin - 50vh.
const ACTIVE = {};
CHAPTERS.reduce((top, chapter) => {
  ACTIVE[chapter.id] = top - 50;
  return top + chapter.vh;
}, 0);
const SCROLL_LENGTH = CHAPTERS.reduce((sum, c) => sum + c.vh, 0) - 100;

// L'anneau vaut deux fois le budget : la limite tombe pile à mi-tour.
const { cost, tight } = SAMPLE_TRIP;
export const GAUGE = {
  first: { fill: cost.total / (cost.budget * 2), counter: cost.total },
  second: { fill: tight.minimum / (tight.budget * 2), counter: tight.minimum },
};

/** Point de départ : la Méditerranée de nuit, la planète en bas de l'écran comme un horizon. */
export function initialState(layout) {
  return {
    x: 0,
    y: -1.44,
    z: 2.55 * layout.far,
    lat: 8,
    lon: 14,
    sunLon: 175,
    intro: 0,
    markers: 0,
    labels: 0,
    typed: 0,
    arc: 0,
    photo: 0,
    events: 0,
    ring: 0,
    fill: 0,
    limit: 0.5,
    counter: 0,
    phase: 0,
    fan: 0,
    focus: 0,
  };
}

/**
 * Timeline unique, lue par le scroll : une unité = une hauteur d'écran.
 * Chaque chapitre déplace la caméra, le soleil et les éléments de la scène.
 */
export function buildTimeline(state, layout) {
  const { side, far, low } = layout;
  const at = (id, offset = 0) => ACTIVE[id] + offset;
  const move = { ease: "power2.inOut" };
  const tl = gsap.timeline({ defaults: { ease: "none" } });

  // Départ → les agents : on recule, la planète se lève et le soleil se lève sur Tunis.
  tl.to(state, { ...move, y: low, z: 5.5 * far, lat: 24, lon: 12, duration: 110 }, 0);
  tl.to(state, { sunLon: 55, duration: 140 }, 0);
  tl.to(state, { lon: 24, sunLon: 25, duration: 150 }, at("agents", 60));

  // La demande : la planète glisse à droite, Tunis et Rome apparaissent.
  tl.to(state, { ...move, x: side, z: 3.3 * far, lat: 39, lon: 12, markers: 0.6, labels: 1, duration: 80 }, at("demande", -10));
  tl.to(state, { typed: 4, duration: 60 }, at("demande", 30));

  // Planificateur : le vol se dessine de Tunis à Rome.
  tl.to(state, { arc: 1, duration: 120, ease: "power1.inOut" }, at("planificateur", 10));
  tl.to(state, { lat: 41, lon: 14, z: 3.0 * far, duration: 120 }, at("planificateur", 10));

  // Programme : plongée sur Rome, la photo s'ouvre depuis la ville, puis la journée.
  tl.to(state, { x: 0, y: 0, lat: ROME.lat, lon: ROME.lon, z: 1.42, labels: 0, markers: 0, duration: 80, ease: "power2.in" }, at("programme"));
  tl.to(state, { photo: 1, duration: 55, ease: "power2.in" }, at("programme", 55));
  tl.set(state, { arc: 0 }, at("programme", 112));
  tl.to(state, { events: 4, duration: 90 }, at("programme", 115));

  // Budget : la photo se referme, la planète recule et l'anneau se remplit.
  tl.to(state, { photo: 0, duration: 45, ease: "power2.out" }, at("budget"));
  tl.to(state, { ...move, y: low, z: 6 * far, lat: 14, lon: 18, duration: 70 }, at("budget", 5));
  tl.to(state, { ring: 1, duration: 25 }, at("budget", 35));
  tl.to(state, { ...GAUGE.first, duration: 60, ease: "power1.out" }, at("budget", 45));
  tl.to(state, { phase: 1, fill: 0, counter: 0, duration: 12 }, at("budget", 125));
  tl.to(state, { ...GAUGE.second, duration: 55, ease: "power1.out" }, at("budget", 140));

  // Destinations : l'anneau s'efface, toutes les routes partent de Tunis, le globe se laisse tourner.
  tl.to(state, { ring: 0, duration: 25 }, at("destinations", -15));
  tl.to(state, { ...move, x: side, y: low, z: 4.3 * far, markers: 1, fan: 1, focus: 1, duration: 80 }, at("destinations", -10));

  // Fin : retour à l'horizon du départ, à l'aube sur Tunis.
  tl.to(state, { ...move, x: 0, y: -1.44, z: 2.55 * far, lat: 8, lon: 14, sunLon: 45, markers: 0, fan: 0, focus: 0, duration: 70 }, at("fin", -20));

  tl.set({}, {}, SCROLL_LENGTH);
  return tl;
}
