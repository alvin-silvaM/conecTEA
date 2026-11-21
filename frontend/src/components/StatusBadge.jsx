import { CircleCheck, CircleMinus } from 'lucide-react';

// A API só tem o campo booleano `ativo`; por isso só existem "Ativo" e "Inativo".
// (O status "Atenção" do Figma não existe no backend.)
export default function StatusBadge({ ativo }) {
  return ativo ? (
    <span className="badge badge--ativo">
      <CircleCheck size={14} aria-hidden="true" /> Ativo
    </span>
  ) : (
    <span className="badge badge--inativo">
      <CircleMinus size={14} aria-hidden="true" /> Inativo
    </span>
  );
}
