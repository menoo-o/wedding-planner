import './hero.css'
import { ReactNode } from 'react';

type TimeUnitProps = {
  value?: ReactNode;
  label?: string;
  variant?: "days" | "hours" | "minutes" | "seconds";
};

const TimeUnit = (props: TimeUnitProps) => {
  const { value, label, variant } = props;

  // 1. Determine how to render the value
  const renderValue = () => {
    // If it's a number or a string that looks like a number, pad it.
    if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
      return String(value).padStart(2, "0");
    }
    
    // If it's a React Component (like <RollingNumber />), just render it directly.
    return value;
  };

  return (
    <figure className={`time-unit time-unit--${variant}`} aria-label={`${label}`}>
      <div className="time-unit__value-wrapper">
        <span className="time-unit__value">
          {renderValue()}
        </span>
      </div>

      <figcaption className="time-unit__label">
        {label}
      </figcaption>
    </figure>
  );
};
export default TimeUnit;