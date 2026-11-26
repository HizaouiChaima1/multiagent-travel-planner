import { Link } from "react-router-dom";
import { SAMPLE_TRIP } from "../../content/sampleTrip.js";
import { formatBudget } from "../../format.js";
import CityPanel from "../CityPanel.jsx";
import { DESTINATIONS } from "../globe/cities.js";
import { chapterHeight } from "./story.js";

const { cost, tight, day } = SAMPLE_TRIP;

/** Titre découpé en lignes qui montent une à une derrière un masque. */
function Lines({ as: Tag = "p", className, lines, ...props }) {
  return (
    <Tag className={className} {...props}>
      {lines.map((line, index) => (
        <span className="line" key={line}>
          <span style={{ "--i": index }}>{line}</span>
        </span>
      ))}
    </Tag>
  );
}

/** Un chapitre : une hauteur de scroll, et un contenu qui reste à l'écran pendant ce temps. */
function Chapter({ id, className = "", children, ...props }) {
  return (
    <section
      id={id}
      className={`chapter ${className}`}
      style={{ height: `${chapterHeight(id)}vh` }}
      data-chapter
      {...props}
    >
      <div className="chapter-pin">{children}</div>
    </section>
  );
}

export function DepartChapter({ start, onDiscover }) {
  return (
    <Chapter id="depart" className="chapter-horizon" aria-labelledby="depart-title">
      <div className="beat beat-center">
        <p className="kicker reveal">Départ Tunis-Carthage · 36,81° N · 10,18° E</p>
        <Lines as="h1" className="display" id="depart-title" lines={["Le monde,", "à partir de Tunis."]} />
        <p className="intro reveal">
          Trois agents d'intelligence artificielle préparent vos vols, votre hôtel et votre
          programme, sans dépasser votre budget.
        </p>
        <div className="hero-actions reveal">
          <Link to={start} className="primary">
            Planifier un voyage
          </Link>
          <button type="button" className="ghost" onClick={onDiscover}>
            Voir les agents travailler
          </button>
        </div>
      </div>
      <p className="scroll-cue reveal">Faites défiler</p>
    </Chapter>
  );
}

export function AgentsChapter() {
  return (
    <Chapter id="agents" className="chapter-split" aria-labelledby="agents-title">
      <h2 id="agents-title" className="statement">
        <Lines as="span" lines={["Pas une agence.", "Trois agents."]} />
      </h2>
      <p className="aside reveal">
        Un planificateur, un programmateur et un contrôleur de budget. Ils travaillent l'un après
        l'autre, et recommencent tant que le voyage ne tient pas dans votre budget.
      </p>
    </Chapter>
  );
}

const REQUEST = ["Rome", "du 12 au 16 décembre", "2 voyageurs", "1 500 € au total"];

export function RequestChapter() {
  return (
    <Chapter id="demande" className="chapter-left" aria-labelledby="demande-title">
      <div className="beat">
        <p id="demande-title" className="kicker reveal">
          Vous écrivez votre demande
        </p>
        <ul className="typed">
          {REQUEST.map((line) => (
            <li key={line} data-typed>
              {line}
            </li>
          ))}
        </ul>
      </div>
    </Chapter>
  );
}

export function PlannerChapter() {
  return (
    <Chapter id="planificateur" className="chapter-left" aria-labelledby="planner-title">
      <div className="beat">
        <p className="numeral reveal">01</p>
        <Lines as="h2" className="title" id="planner-title" lines={["Le planificateur"]} />
        <p className="body reveal">
          Il compare les vols au départ de Tunis et les hôtels de Rome, puis garde la paire qui
          laisse le plus de place au reste du voyage.
        </p>
        <dl className="figures reveal">
          <div>
            <dt>Vols aller et retour, 2 voyageurs</dt>
            <dd>{formatBudget(cost.flights)}</dd>
          </div>
          <div>
            <dt>Maison Cèdre, 4 nuits</dt>
            <dd>{formatBudget(cost.hotel)}</dd>
          </div>
        </dl>
      </div>
    </Chapter>
  );
}

export function ProgrammeChapter() {
  return (
    <Chapter id="programme" className="chapter-programme" aria-labelledby="programme-title">
      <div className="beat">
        <p className="numeral reveal">02</p>
        <Lines as="h2" className="title" id="programme-title" lines={["Le programme"]} />
        <p className="body reveal">
          Quatorze activités sur cinq jours. Jamais deux à la même heure, jamais avant
          l'atterrissage.
        </p>
      </div>
      <ol className="day-plan" aria-label={day.label}>
        <li className="day-label" data-event>
          {day.label}
        </li>
        {day.events.map(([time, name, kind, price]) => (
          <li key={time} data-event>
            <span className="day-time">{time}</span>
            <span className="day-name">{name}</span>
            <span className="day-kind">
              {kind} · {formatBudget(price)}
            </span>
          </li>
        ))}
      </ol>
    </Chapter>
  );
}

export function BudgetChapter() {
  return (
    <Chapter id="budget" className="chapter-split chapter-budget" aria-labelledby="budget-title" data-phase>
      <div className="beat">
        <p className="numeral reveal">03</p>
        <Lines as="h2" className="title" id="budget-title" lines={["Le budget"]} />
        <p className="body reveal">
          Il additionne tout. Trop cher ? Il change d'hôtel, puis de vol, puis retire les activités
          payantes. Et si c'est impossible, il le dit.
        </p>
      </div>
      <div className="meter reveal" aria-live="off">
        <p className="meter-asked">
          <span className="first">Budget {formatBudget(cost.budget)}</span>
          <span className="second">Budget {formatBudget(tight.budget)}</span>
        </p>
        <p className="meter-figure" data-counter>
          {formatBudget(cost.total)}
        </p>
        <p className="meter-note">
          <span className="first">Dans le budget, tolérance de 5 % au plus.</span>
          <span className="second">« {tight.message} »</span>
        </p>
      </div>
    </Chapter>
  );
}

export function DestinationsChapter({ city, onSelect }) {
  return (
    <Chapter id="destinations" className="chapter-destinations" aria-labelledby="destinations-title">
      <div className="beat">
        <p className="kicker reveal">Décembre et janvier, au départ de Tunis</p>
        <Lines as="h2" className="title" id="destinations-title" lines={["Où partez-vous ?"]} />
        <ul className="city-names reveal">
          {DESTINATIONS.map(({ name }) => (
            <li key={name}>
              <button
                type="button"
                aria-pressed={name === city}
                onClick={() => onSelect(name)}
                onMouseEnter={() => onSelect(name)}
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
        <p className="drag-hint reveal">Glissez pour tourner le globe, touchez une ville.</p>
      </div>
      <div className="city-dock reveal">
        <CityPanel city={city} />
      </div>
    </Chapter>
  );
}

export function FinChapter({ start }) {
  return (
    <Chapter id="fin" className="chapter-horizon" aria-labelledby="fin-title">
      <div className="beat beat-center">
        <Lines as="h2" className="display" id="fin-title" lines={["Votre prochain", "départ de Tunis."]} />
        <div className="hero-actions reveal">
          <Link to={start} className="primary">
            Planifier un voyage
          </Link>
        </div>
      </div>
    </Chapter>
  );
}
