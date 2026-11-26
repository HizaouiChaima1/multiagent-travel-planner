import "./DestinationList.css";

export default function DestinationList({ cities, selected, onSelect }) {
  if (cities.length === 0) return null;

  return (
    <nav aria-label="Destinations disponibles">
      <ul className="cities">
        {cities.map((city) => {
          const isSelected = city.toLowerCase() === selected.trim().toLowerCase();
          return (
            <li key={city}>
              <button
                type="button"
                className="city"
                aria-pressed={isSelected}
                onClick={() => onSelect(city)}
              >
                {city}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
