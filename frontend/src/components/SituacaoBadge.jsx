import { CircleCheck, CircleMinus } from 'lucide-react';

// Situação do aluno nas telas do cuidador. Hoje só existem "ativo" e "inativo".
// FUTURO: para liberar "Atenção", acrescente aqui
//   atencao: { rotulo: 'Atenção', icon: CircleAlert, classe: 'atencao' }
// (importando CircleAlert do lucide-react). O estilo .badge--atencao já existe em styles/cuidador.css
// e o back-end também precisa aceitar "atencao" em SITUACOES (models/aluno.model.js).
// Situação desconhecida cai em "Ativo".
export const SITUACOES = {
  ativo: { rotulo: 'Ativo', icon: CircleCheck, classe: 'ativo' },
  inativo: { rotulo: 'Inativo', icon: CircleMinus, classe: 'inativo' },
};

export const rotuloSituacao = (situacao) => (SITUACOES[situacao] ?? SITUACOES.ativo).rotulo;

export default function SituacaoBadge({ situacao }) {
  const { rotulo, icon: Icon, classe } = SITUACOES[situacao] ?? SITUACOES.ativo;
  return (
    <span className={`badge badge--${classe}`}>
      <Icon size={14} aria-hidden="true" /> {rotulo}
    </span>
  );
}
