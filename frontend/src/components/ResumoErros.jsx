import { useEffect, useRef } from 'react';
import Alert from './Alert.jsx';

// Resumo de erros no topo do formulário, com links que levam o foco para cada campo.
// `tentativa` aumenta a cada envio com erro: é o sinal para mover o foco até o resumo.
export default function ResumoErros({ erros, rotulos, tentativa, entidade, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (tentativa > 0) ref.current?.focus();
  }, [tentativa]);

  const lista = Object.entries(erros).filter(([campo]) => rotulos[campo]);
  return (
    <div ref={ref} tabIndex={-1} className="focus-target">
      {lista.length > 0 && (
        <Alert titulo={`Corrija ${lista.length} ${lista.length === 1 ? 'campo' : 'campos'} para salvar ${entidade}`}>
          <ul className="alert__links">
            {lista.map(([campo, msg]) => (
              <li key={campo}>
                <a
                  href={`#${campo}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(campo)?.focus();
                  }}
                >
                  {rotulos[campo]}: {msg.charAt(0).toLowerCase() + msg.slice(1)}
                </a>
              </li>
            ))}
          </ul>
        </Alert>
      )}
      {children}
    </div>
  );
}
