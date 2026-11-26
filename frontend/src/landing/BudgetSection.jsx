import { SAMPLE_TRIP } from "../content/sampleTrip.js";
import { formatBudget } from "../format.js";

/** La promesse budget, prouvée par deux vraies réponses de l'agent budget. */
export default function BudgetSection() {
  const { cost, tight } = SAMPLE_TRIP;
  return (
    <section className="budget-proof" aria-labelledby="budget-title">
      <h2 id="budget-title" data-reveal>
        Le budget décide, pas l'inverse
      </h2>
      <div className="budget-cases">
        <article data-reveal>
          <p className="budget-asked">Budget {formatBudget(cost.budget)}</p>
          <p className="budget-figure">{formatBudget(cost.total)}</p>
          <p>
            Rome pour deux, quatre nuits, vols, hôtel et quatorze activités compris. Tolérance de
            5 % au plus.
          </p>
        </article>
        <article data-reveal>
          <p className="budget-asked">Budget {formatBudget(tight.budget)}</p>
          <p className="budget-figure">{formatBudget(tight.minimum)} au minimum</p>
          <p>L'agent budget ne force rien : « {tight.message} »</p>
        </article>
      </div>
    </section>
  );
}
