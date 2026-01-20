import './hero.css'

type TimeUnitProps = {
  value: number;
  label?: string;
  variant?: "days" | "hours" | "minutes" | "seconds";
};

const TimeUnit = (props: TimeUnitProps) => {
  const value = props.value;
  const label = props.label;
  const variant = props.variant;

  return (
    <figure className={`time-unit time-unit--${variant}`}>
      <div className="time-unit__value-wrapper">
        <span className="time-unit__value">
          {String(value).padStart(2, "0")}
        </span>
      </div>

      <figcaption className="time-unit__label">
        {label}
      </figcaption>
    </figure>
  );
};

export default TimeUnit;