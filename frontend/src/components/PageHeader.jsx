export default function PageHeader({ titulo, descricao, acao }) {
  return (
    <header className="page-header">
      <div>
        <h1>{titulo}</h1>
        {descricao && <p className="page-header__desc">{descricao}</p>}
      </div>
      {acao}
    </header>
  );
}
