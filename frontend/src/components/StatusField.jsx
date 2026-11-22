import { CircleCheck, CircleMinus } from 'lucide-react';

// Escolha entre Ativo e Inativo (campo `ativo` da API). O estado nunca depende só da cor:
// cada opção tem ícone e texto. É salvo junto com o restante do formulário.
export default function StatusField({ valor, onChange, descricao }) {
  return (
    <fieldset className="status-field">
      <legend className="field__label">Status</legend>
      <div className="status-options">
        <label className="status-option">
          <input type="radio" name="status" checked={valor === true} onChange={() => onChange(true)} />
          <CircleCheck size={18} aria-hidden="true" /> Ativo
        </label>
        <label className="status-option">
          <input type="radio" name="status" checked={valor === false} onChange={() => onChange(false)} />
          <CircleMinus size={18} aria-hidden="true" /> Inativo
        </label>
      </div>
      {descricao && <p className="field__hint">{descricao}</p>}
    </fieldset>
  );
}
