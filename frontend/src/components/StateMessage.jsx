// Bloco central usado nos estados "lista vazia", "busca sem resultados" e "erro ao carregar"
export default function StateMessage({ icon: Icon, tone = 'info', title, children, action }) {
  return (
    <div className="state">
      <span className={`state__icon state__icon--${tone}`}>
        <Icon size={22} aria-hidden="true" />
      </span>
      <h2 className="state__title">{title}</h2>
      {children && <p className="state__text">{children}</p>}
      {action}
    </div>
  );
}
