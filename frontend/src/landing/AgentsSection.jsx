import { SAMPLE_TRIP } from "../content/sampleTrip.js";
import { formatBudget } from "../format.js";

/** Comment ça marche : ce que chaque agent a réellement produit pour le voyage de démonstration. */
export default function AgentsSection() {
  const { request, steps, day, cost } = SAMPLE_TRIP;
  return (
    <section className="agents" id="agents" aria-labelledby="agents-title">
      <div className="agents-text" data-reveal>
        <h2 id="agents-title">Une demande, trois agents</h2>
        <p className="agents-request">Demande : {request}.</p>
        <ol className="agents-steps">
          {steps.map(([agent, result]) => (
            <li key={agent}>
              <span className="agent-name">{agent}</span>
              <span>{result}</span>
            </li>
          ))}
        </ol>
      </div>

      <figure className="agents-ui" data-ui data-reveal>
        <figcaption>{day.label}</figcaption>
        <ol>
          {day.events.map(([time, title, meta, price]) => (
            <li key={title}>
              <span className="event-time">{time}</span>
              <span className="event-body">
                <span className="event-title">{title}</span>
                <span className="event-meta">{meta}</span>
              </span>
              <span className="event-price">{formatBudget(price)} / pers.</span>
            </li>
          ))}
        </ol>
        <div className="agents-ui-total">
          <p>
            {formatBudget(cost.total)} <span>sur {formatBudget(cost.budget)}</span>
          </p>
          <div className="agents-ui-bar">
            <span style={{ width: `${(cost.total / cost.budget) * 100}%` }} />
          </div>
          <p className="agents-ui-split">
            Vols {formatBudget(cost.flights)}, hôtel {formatBudget(cost.hotel)}, activités{" "}
            {formatBudget(cost.activities)}
          </p>
        </div>
      </figure>
    </section>
  );
}
