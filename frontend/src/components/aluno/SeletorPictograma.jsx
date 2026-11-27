import { useEffect, useState } from 'react';
import { PICTOGRAMAS } from '../../utils/cartoes.js';

// Folha que sobe de baixo com a biblioteca de pictogramas ("Escolha um pictograma").
export default function SeletorPictograma({ atual, onEscolher, onCancelar }) {
  const [marcado, setMarcado] = useState(atual ?? null);

  useEffect(() => {
    const fechar = (e) => e.key === 'Escape' && onCancelar();
    window.addEventListener('keydown', fechar);
    return () => window.removeEventListener('keydown', fechar);
  }, [onCancelar]);

  return (
    <div className="folha" role="presentation" onClick={onCancelar}>
      <div
        className="folha__painel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="folha-titulo"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="folha__alca" aria-hidden="true" />
        <h2 id="folha-titulo">Escolha um pictograma</h2>
        <div className="folha__grade" role="radiogroup" aria-labelledby="folha-titulo">
          {PICTOGRAMAS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={marcado === p.id}
              aria-label={p.nome}
              className={`folha__item ${marcado === p.id ? 'is-ativo' : ''}`}
              onClick={() => setMarcado(p.id)}
            >
              <img src={p.src} alt="" />
            </button>
          ))}
        </div>
        <div className="folha__acoes">
          <button type="button" className="aluno-btn aluno-btn--claro" onClick={onCancelar}>
            Cancelar
          </button>
          <button
            type="button"
            className="aluno-btn aluno-btn--azul"
            disabled={!marcado}
            onClick={() => onEscolher(marcado)}
          >
            Escolher
          </button>
        </div>
      </div>
    </div>
  );
}
