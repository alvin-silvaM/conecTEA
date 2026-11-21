import { Search, X } from 'lucide-react';

// Campo de busca com ícone de lupa e botão "x" para limpar
export default function SearchField({ id, label, value, onChange, placeholder, className = '' }) {
  return (
    <div className={`field ${className}`.trim()}>
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      <div className="input">
        <Search className="input__icon" size={20} aria-hidden="true" />
        <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        {value && (
          <button type="button" className="input__clear" onClick={() => onChange('')} aria-label="Limpar busca">
            <X size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
