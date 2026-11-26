import { formatBudget } from "../format.js";
import { BUDGET_STATUS } from "./labels.js";

/** Coût total comparé au budget, avec le détail et le message de l'agent budget. */
export default function BudgetMeter({ itinerary }) {
  const { cost, budget, budget_status: status, budget_message: message } = itinerary;
  const { label, tone } = BUDGET_STATUS[status];
  const fill = Math.min(100, (cost.total / budget) * 100);

  return (
    <section className="budget-meter" data-tone={tone} aria-label="Budget">
      <p className="budget-total">
        {formatBudget(cost.total)} <span>sur {formatBudget(budget)}</span>
      </p>
      <div
        className="budget-bar"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={budget}
        aria-valuenow={cost.total}
        aria-label="Part du budget utilisée"
      >
        <span style={{ width: `${fill}%` }} />
      </div>
      <p className="budget-status">{label}</p>
      {message && <p className="budget-message">{message}</p>}
      <dl className="budget-split">
        <div>
          <dt>Vols</dt>
          <dd>{formatBudget(cost.flights)}</dd>
        </div>
        <div>
          <dt>Hôtel</dt>
          <dd>{formatBudget(cost.hotel)}</dd>
        </div>
        <div>
          <dt>Activités</dt>
          <dd>{formatBudget(cost.activities)}</dd>
        </div>
      </dl>
    </section>
  );
}
