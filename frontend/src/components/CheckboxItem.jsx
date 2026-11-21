import { Check } from 'lucide-react';

export default function CheckboxItem({ id, label, checked, onChange }) {
  return (
    <label className="check" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="check__box" aria-hidden="true">
        <Check size={14} strokeWidth={3} />
      </span>
      <span>{label}</span>
    </label>
  );
}
