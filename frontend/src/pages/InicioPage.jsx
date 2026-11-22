import { Link } from 'react-router-dom';
import { CircleAlert, User, Users } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import Button from '../components/Button.jsx';
import Avatar from '../components/Avatar.jsx';
import StateMessage from '../components/StateMessage.jsx';
import { useApiData } from '../hooks/useApiData.js';
import { listarAlunos, listarCuidadores } from '../services/api.js';
import { plural } from '../utils/format.js';

const carregar = () => Promise.all([listarAlunos(), listarCuidadores()]);

function StatCard({ rotulo, valor, icon: Icon }) {
  return (
    <div className="card stat">
      {Icon && (
        <span className="stat__icon">
          <Icon size={20} aria-hidden="true" />
        </span>
      )}
      <div>
        <p className="stat__label">{rotulo}</p>
        <p className="stat__value">{valor}</p>
      </div>
    </div>
  );
}

export default function InicioPage() {
  const { data, loading, error, reload } = useApiData(carregar);

  const acao = <Button to="/alunos/novo">Adicionar aluno</Button>;

  if (error) {
    return (
      <>
        <PageHeader titulo="Início" descricao="Olá! Acompanhe aqui os alunos e cuidadores da sua instituição." acao={acao} />
        <div className="card">
          <StateMessage icon={CircleAlert} tone="erro" title="Não foi possível carregar o painel" action={<Button onClick={reload}>Tentar novamente</Button>}>
            {error.message}
          </StateMessage>
        </div>
      </>
    );
  }

  const [alunos, cuidadores] = data ?? [[], []];
  const alunosAtivos = alunos.filter((a) => a.ativo).length;
  const alunosInativos = alunos.length - alunosAtivos;
  const cuidadoresAtivos = cuidadores.filter((c) => c.ativo);
  const vinculados = (id) => alunos.filter((a) => a.cuidador?._id === id).length;

  return (
    <>
      <PageHeader titulo="Início" descricao="Olá! Acompanhe aqui os alunos e cuidadores da sua instituição." acao={acao} />

      <section className="stats" aria-label="Resumo" aria-busy={loading}>
        <StatCard rotulo="Alunos ativos" valor={loading ? '–' : alunosAtivos} icon={User} />
        <StatCard rotulo="Cuidadores ativos" valor={loading ? '–' : cuidadoresAtivos.length} icon={Users} />
        <StatCard rotulo="Alunos inativos" valor={loading ? '–' : alunosInativos} />
      </section>

      <section className="card list-card" aria-labelledby="titulo-cuidadores">
        <h2 id="titulo-cuidadores">Cuidadores ativos</h2>
        <p className="card__desc">Cuidadores vinculados à instituição.</p>
        {loading ? (
          <p role="status">Carregando…</p>
        ) : cuidadoresAtivos.length === 0 ? (
          <p className="card__empty">Nenhum cuidador ativo. <Link to="/cuidadores/novo">Adicionar cuidador</Link></p>
        ) : (
          <ul className="simple-list">
            {cuidadoresAtivos.slice(0, 5).map((c) => (
              <li key={c._id}>
                <Avatar nome={c.nome} />
                <div>
                  <p className="simple-list__title">{c.nome}</p>
                  <p className="simple-list__sub">{plural(vinculados(c._id), 'aluno vinculado', 'alunos vinculados')}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
