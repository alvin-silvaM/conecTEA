import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ pagina, totalPaginas, onChange }) {
  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1);
  return (
    <nav className="pagination" aria-label="Paginação">
      <p>
        Página {pagina} de {totalPaginas}
      </p>
      <div className="pagination__controls">
        <button type="button" className="pagination__btn" disabled={pagina <= 1} onClick={() => onChange(pagina - 1)}>
          <ChevronLeft size={18} aria-hidden="true" /> Anterior
        </button>
        {paginas.map((n) => (
          <button
            type="button"
            key={n}
            className={`pagination__btn pagination__num ${n === pagina ? 'is-current' : ''}`}
            aria-current={n === pagina ? 'page' : undefined}
            aria-label={`Página ${n}`}
            onClick={() => onChange(n)}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          className="pagination__btn"
          disabled={pagina >= totalPaginas}
          onClick={() => onChange(pagina + 1)}
        >
          Próxima <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
