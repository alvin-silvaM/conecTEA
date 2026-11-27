// Nuvens decorativas do topo (só enfeite: escondidas dos leitores de tela)
function Nuvem({ className }) {
  return (
    <svg className={`nuvem ${className}`} viewBox="0 0 120 50" aria-hidden="true" focusable="false">
      <path
        d="M20 48 C6 48 0 38 8 30 C10 20 22 16 30 22 C34 8 56 4 66 16 C76 8 96 12 98 28 C112 28 120 40 110 48 Z"
        fill="#fff"
        opacity=".85"
      />
    </svg>
  );
}

export default function Nuvens() {
  return (
    <>
      <Nuvem className="nuvem--a" />
      <Nuvem className="nuvem--b" />
    </>
  );
}
