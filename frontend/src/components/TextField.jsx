import { forwardRef } from 'react';
import { CircleAlert } from 'lucide-react';

// Campo de texto com rótulo, dica, mensagem de erro (ícone + texto, nunca só cor),
// ícone à esquerda (`icon`) e elemento à direita (`end`, ex.: botão de mostrar senha).
const TextField = forwardRef(function TextField(
  { id, label, hint, error, icon: Icon, end, className = '', ...inputProps },
  ref,
) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={`field ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className="field__label">
          {label}
        </label>
      )}
      <div className={`input ${error ? 'input--error' : ''}`}>
        {Icon && <Icon className="input__icon" size={20} aria-hidden="true" />}
        <input
          id={id}
          ref={ref}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          {...inputProps}
        />
        {end}
      </div>
      {error && (
        <p id={errorId} className="field__error">
          <CircleAlert size={16} aria-hidden="true" /> {error}
        </p>
      )}
      {hint && (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      )}
    </div>
  );
});

export default TextField;
