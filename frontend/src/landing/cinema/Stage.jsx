import { useEffect, useRef } from "react";
import { photoForCity } from "../../content/photos.js";

const ROME_PHOTO = photoForCity("Rome");

/** Place une étiquette sur un point projeté, visible seulement sur la face avant du globe. */
function place(label, point, amount) {
  const opacity = amount * Math.min(Math.max((point.facing - 0.1) * 4, 0), 1);
  label.style.opacity = opacity.toFixed(3);
  label.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
}

/**
 * Le décor fixe derrière le récit : la scène 3D (chargée à part avec three.js),
 * les étiquettes accrochées à Tunis et Rome, et la photo de Rome qui s'ouvre depuis la ville.
 */
export default function Stage({ state, interaction, onProgress, onReady, onUnsupported }) {
  const mountRef = useRef(null);
  const photoRef = useRef(null);
  const tunisRef = useRef(null);
  const romeRef = useRef(null);

  useEffect(() => {
    let dispose = null;
    let cancelled = false;

    const onFrame = ({ size, tunis, rome, interactive }) => {
      place(tunisRef.current, tunis, state.labels);
      place(romeRef.current, rome, state.labels);
      const photo = photoRef.current;
      const radius = state.photo ** 1.6 * Math.hypot(size.w, size.h);
      photo.style.visibility = state.photo > 0.002 ? "visible" : "hidden";
      photo.style.clipPath = `circle(${radius.toFixed(1)}px at ${rome.x.toFixed(1)}px ${rome.y.toFixed(1)}px)`;
      photo.style.setProperty("--zoom", (1.35 - state.photo * 0.35).toFixed(3));
      mountRef.current.classList.toggle("is-interactive", interactive);
    };

    import("./scene.js")
      .then(({ createScene }) => {
        if (cancelled) return;
        dispose = createScene({ mount: mountRef.current, state, interaction, onFrame, onProgress, onReady });
      })
      .catch(() => {
        if (!cancelled) onUnsupported();
      });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [state, interaction, onProgress, onReady, onUnsupported]);

  return (
    <div className="stage" aria-hidden="true">
      <div className="stage-canvas" ref={mountRef} />
      <div className="stage-label" ref={tunisRef}>
        <strong>Tunis</strong>
        <span>Départ, Tunis-Carthage</span>
      </div>
      <div className="stage-label" ref={romeRef}>
        <strong>Rome</strong>
        <span>12 → 16 décembre</span>
      </div>
      <div className="stage-photo" ref={photoRef}>
        <img src={ROME_PHOTO.src} alt="" />
      </div>
    </div>
  );
}
