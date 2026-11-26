import { AGENT_LABEL } from "./labels.js";

/** Journal de l'orchestrateur (US08) : ce que chaque agent a fait, dans l'ordre. */
export default function AgentLog({ steps }) {
  if (!steps.length) return null;
  return (
    <section className="agent-log" aria-labelledby="agent-log-title">
      <h2 id="agent-log-title">Ce que les agents ont fait</h2>
      <ol>
        {steps.map((step, index) => (
          <li key={index}>
            <span className="agent-name">{AGENT_LABEL[step.agent]}</span>
            <span>{step.message}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
