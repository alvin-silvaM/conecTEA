// Esqueleto estático (sem animação) enquanto a lista carrega.
export default function TableSkeleton({ colunas, linhas = 4, rotulo }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{rotulo}</span>
      <div className="table-wrap" aria-hidden="true">
        <div className="table-head" style={{ gridTemplateColumns: colunas.grid }}>
          {colunas.titulos.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
        {Array.from({ length: linhas }).map((_, i) => (
          <div className="table-row" style={{ gridTemplateColumns: colunas.grid }} key={i}>
            <span className="skeleton skeleton--avatar" />
            {colunas.titulos.slice(1).map((t) => (
              <span className="skeleton skeleton--bar" key={t} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
