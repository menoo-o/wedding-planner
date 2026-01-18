
const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <figure className="time-unit">
    <div className="time-unit__value-wrapper">
      <span className="time-unit__value">
        {String(value).padStart(2, "0")}
      </span>
    </div>

    <figcaption className="time-unit__label">
      {label}
    </figcaption>
  </figure>
)

export default TimeUnit
