import { Cake, Heart, House, LogOut, Mail, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';

// A data vem como meia-noite UTC: formata em UTC para não "voltar um dia" no fuso do Brasil.
const formatarData = (iso) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

export default function MeusDadosAlunoPage() {
  const { aluno, sair } = useAuth();
  const navigate = useNavigate();
  if (!aluno) return <p className="aluno__carregando">Carregando…</p>;

  const linhas = [
    { cor: 'azul', Icone: User, rotulo: 'Nome', valor: aluno.nome },
    { cor: 'lilas', Icone: Mail, rotulo: 'E-mail', valor: aluno.email },
    { cor: 'rosa', Icone: Heart, rotulo: 'Cuidador', valor: aluno.cuidador?.nome },
    { cor: 'verde', Icone: House, rotulo: 'Escola', valor: aluno.escola?.razaoSocial },
    { cor: 'amarelo', Icone: Cake, rotulo: 'Data de nascimento', valor: formatarData(aluno.dataNascimento) },
  ].filter((l) => l.valor);

  return (
    <>
      <div className="perfil-topo">
        <span className="perfil-topo__avatar" aria-hidden="true">
          {aluno.nome.trim()[0].toUpperCase()}
        </span>
        <h1>{aluno.nome}</h1>
        <p>Meus dados</p>
      </div>

      <dl className="dados">
        {linhas.map(({ cor, Icone, rotulo, valor }) => (
          <div key={rotulo} className="dados__linha">
            <span className={`dados__icone dados__icone--${cor}`}>
              <Icone size={22} aria-hidden="true" />
            </span>
            <div>
              <dt>{rotulo}</dt>
              <dd>{valor}</dd>
            </div>
          </div>
        ))}
      </dl>

      <div className="acoes acoes--coluna">
        <button type="button" className="aluno-btn aluno-btn--claro" onClick={() => navigate('/')}>
          Voltar
        </button>
        <button type="button" className="aluno-btn aluno-btn--texto" onClick={sair}>
          <LogOut size={20} aria-hidden="true" /> Sair
        </button>
      </div>
    </>
  );
}
