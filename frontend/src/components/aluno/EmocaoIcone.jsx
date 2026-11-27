// Carinhas das emoções (desenhadas em SVG, no estilo do Figma: contorno azul-marinho e cor chapada).
const TRACO = '#1c2650';

const CORES = {
  feliz: '#f8a626',
  triste: '#2f86e6',
  raiva: '#f26b6b',
  medo: '#1f9f9a',
  cansado: '#8e72e8',
  tranquilo: '#4cbf78',
};

const linha = { fill: 'none', stroke: TRACO, strokeWidth: 2.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Olhos = () => (
  <>
    <circle cx="17" cy="21" r="2.4" fill={TRACO} />
    <circle cx="31" cy="21" r="2.4" fill={TRACO} />
  </>
);
const Bochechas = () => (
  <>
    <circle cx="11.5" cy="28" r="3" fill="#ff8aa0" opacity=".75" />
    <circle cx="36.5" cy="28" r="3" fill="#ff8aa0" opacity=".75" />
  </>
);

const ROSTOS = {
  feliz: (
    <>
      <Olhos />
      <Bochechas />
      <path d="M14.5 28 Q24 40 33.5 28 Z" fill="#fff" stroke={TRACO} strokeWidth="2.6" strokeLinejoin="round" />
    </>
  ),
  triste: (
    <>
      <Olhos />
      <path d="M17 34 Q24 27.5 31 34" {...linha} />
      <path d="M34 25 q3 4 0 6 q-3 -2 0 -6z" fill="#bfe3ff" stroke={TRACO} strokeWidth="1.6" />
    </>
  ),
  raiva: (
    <>
      <path d="M11.5 14 L21 18.5 M36.5 14 L27 18.5" {...linha} />
      <circle cx="17" cy="23" r="2.4" fill={TRACO} />
      <circle cx="31" cy="23" r="2.4" fill={TRACO} />
      <path d="M17 35 Q24 28.5 31 35" {...linha} />
    </>
  ),
  medo: (
    <>
      <circle cx="16.5" cy="20" r="5" fill="#fff" stroke={TRACO} strokeWidth="2.2" />
      <circle cx="31.5" cy="20" r="5" fill="#fff" stroke={TRACO} strokeWidth="2.2" />
      <circle cx="16.5" cy="21" r="2" fill={TRACO} />
      <circle cx="31.5" cy="21" r="2" fill={TRACO} />
      <ellipse cx="24" cy="34" rx="3.6" ry="4.4" fill="#0f5e5a" stroke={TRACO} strokeWidth="2.2" />
    </>
  ),
  cansado: (
    <>
      <path d="M12.5 22 Q17 26 21.5 22 M26.5 22 Q31 26 35.5 22" {...linha} />
      <path d="M20 33 H28" {...linha} />
      <path d="M35 5 h6 l-6 7 h6" fill="none" stroke={TRACO} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  tranquilo: (
    <>
      <path d="M12.5 22 Q17 17.5 21.5 22 M26.5 22 Q31 17.5 35.5 22" {...linha} />
      <Bochechas />
      <path d="M17 30 Q24 37.5 31 30" {...linha} />
    </>
  ),
};

export default function EmocaoIcone({ tipo, size = 44 }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="21" fill={CORES[tipo]} stroke={TRACO} strokeWidth="3" />
      {ROSTOS[tipo]}
    </svg>
  );
}
