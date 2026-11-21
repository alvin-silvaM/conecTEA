import { iniciais } from '../utils/format.js';

export default function Avatar({ nome }) {
  return (
    <span className="avatar" aria-hidden="true">
      {iniciais(nome)}
    </span>
  );
}
