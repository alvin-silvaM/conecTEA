import { Pencil, Trash2 } from 'lucide-react';
import Button from './Button.jsx';

// Ações de uma linha de tabela: editar, ativar/desativar e excluir.
// O aria-label inclui o nome, para leitores de tela diferenciarem os botões de cada linha.
export default function RowActions({ nome, editarTo, ativo, ocupado, onAlternarStatus, onExcluir }) {
  const acaoStatus = ativo ? 'Desativar' : 'Ativar';
  return (
    <div className="row-actions">
      <Button variant="secondary" className="btn--sm" to={editarTo} aria-label={`Editar ${nome}`}>
        <Pencil size={15} aria-hidden="true" /> Editar
      </Button>
      <Button variant="secondary" className="btn--sm" onClick={onAlternarStatus} disabled={ocupado} aria-label={`${acaoStatus} ${nome}`}>
        {acaoStatus}
      </Button>
      <Button variant="danger" className="btn--sm" onClick={onExcluir} disabled={ocupado} aria-label={`Excluir ${nome}`}>
        <Trash2 size={15} aria-hidden="true" /> Excluir
      </Button>
    </div>
  );
}
