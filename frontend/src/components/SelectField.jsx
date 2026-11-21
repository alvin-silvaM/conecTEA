import { ChevronDown } from 'lucide-react';

export default function SelectField({ id, label, error, children, className = '', ...props }) {
  return (
    <div className={`field ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className="field__label">
          {label}
        </label>
      )}
      <div className={`input input--select ${error ? 'input--error' : ''}`}>
        <select id={id} aria-invalid={error ? 'true' : undefined} {...props}>
          {children}
        </select>
        <ChevronDown className="input__chevron" size={20} aria-hidden="true" />
      </div>
      {error && <p className="field__error">{error}</p>}
    </div>
  );
}
