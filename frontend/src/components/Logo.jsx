import icone from '../assets/icone.svg';
import palavra from '../assets/logo.svg';

// Logo completo = ícone (colorido) + nome "ConecTEA". Os dois vêm do Figma.
export default function Logo({ height = 40 }) {
  return (
    <span className="logo" role="img" aria-label="ConecTEA">
      <img src={icone} alt="" style={{ height }} />
      <img src={palavra} alt="" style={{ height: height * 0.55 }} />
    </span>
  );
}
