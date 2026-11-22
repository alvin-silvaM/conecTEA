import { useEffect, useRef } from 'react';
import { CircleAlert } from 'lucide-react';
import Button from './Button.jsx';

// Janela de confirmação para ações irreversíveis (ex.: excluir).
// Usa o elemento nativo <dialog>: showModal() já prende o foco dentro da janela, bloqueia o
// restante da página e fecha com a tecla Esc.
export default function ConfirmDialog({
  aberto,
  titulo,
  children,
  textoConfirmar = 'Excluir',
  erro,
  carregando = false,
  onConfirmar,
  onCancelar,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (aberto && !dialog.open) dialog.showModal();
    if (!aberto && dialog.open) dialog.close();
  }, [aberto]);

  const cancelar = () => {
    if (!carregando) onCancelar();
  };

  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="dialog-titulo"
      onCancel={(e) => {
        e.preventDefault(); // Esc: quem fecha é o estado do componente pai
        cancelar();
      }}
      onClick={(e) => e.target === ref.current && cancelar()} // clique fora da janela
    >
      <div className="dialog__body">
        <h2 id="dialog-titulo">{titulo}</h2>
        {children}
        {erro && (
          <p className="field__error" role="alert">
            <CircleAlert size={16} aria-hidden="true" /> {erro}
          </p>
        )}
        <div className="dialog__actions">
          <Button variant="secondary" onClick={cancelar} disabled={carregando} autoFocus>
            Cancelar
          </Button>
          <Button variant="danger-solid" onClick={onConfirmar} disabled={carregando}>
            {carregando ? 'Excluindo…' : textoConfirmar}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
