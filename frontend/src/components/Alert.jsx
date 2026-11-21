import { CircleAlert, CircleCheck, X } from 'lucide-react';

// tipo: "erro" | "sucesso". Sempre com ícone + título + texto.
// role="alert" faz leitores de tela anunciarem a mensagem.
export default function Alert({ tipo = 'erro', titulo, children, onClose }) {
  const Icon = tipo === 'sucesso' ? CircleCheck : CircleAlert;
  return (
    <div className={`alert alert--${tipo}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      <Icon size={20} aria-hidden="true" className="alert__icon" />
      <div className="alert__body">
        {titulo && <p className="alert__title">{titulo}</p>}
        {children}
      </div>
      {onClose && (
        <button type="button" className="alert__close" onClick={onClose} aria-label="Fechar aviso">
          <X size={18} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
