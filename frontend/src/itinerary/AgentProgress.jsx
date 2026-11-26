import { useEffect, useState } from "react";
import { AGENT_LABEL } from "./labels.js";

const STAGES = [
  ["planificateur", "choisit les vols aller-retour et l'hôtel"],
  ["programme", "répartit les activités jour par jour"],
  ["budget", "vérifie le coût total et ajuste si besoin"],
];
const STAGE_MS = 1400;

/** Indicateur de chargement pendant que les agents travaillent (US09). */
export default function AgentProgress({ destination }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActive((i) => Math.min(i + 1, STAGES.length - 1)), STAGE_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="agent-progress" role="status" aria-live="polite">
      <h1>Les agents préparent {destination}</h1>
      <p className="lead">Cela prend quelques secondes.</p>
      <ol>
        {STAGES.map(([agent, task], index) => (
          <li key={agent} data-state={index < active ? "done" : index === active ? "active" : "todo"}>
            <span className="agent-name">{AGENT_LABEL[agent]}</span>
            <span className="agent-task">{task}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
