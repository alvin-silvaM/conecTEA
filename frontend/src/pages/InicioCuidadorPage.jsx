import { Link } from 'react-router-dom';
import { Building2, ChevronRight, CircleAlert, ClipboardList, Pin, User } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import Button from '../components/Button.jsx';
import Avatar from '../components/Avatar.jsx';
import StateMessage from '../components/StateMessage.jsx';
import { rotuloSituacao } from '../components/SituacaoBadge.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { useApiData } from '../hooks/useApiData.js';
import { buscarInicioCuidador } from '../services/api.js';

const primeiroNome = (nome = '') => nome.trim().split(/\s+/)[0] ?? '';

function StatCard({ rotulo, valor, icon: Icon }) {
  return (
    <div className="card stat">
      <span className="stat__icon">
        <Icon size={20} aria-hidden="true" />
      </span>
      <div>
        <p className="stat__label">{rotulo}</p>
        <p className="stat__value">{valor}</p>
      </div>
    </div>
  );
}

// Início do cuidador: resumo dos alunos vinculados a ele e os que ele fixou
export default function InicioCuidadorPage() {
  const { cuidador } = useAuth();
  const { data, loading, error, reload } = useApiData(buscarInicioCuidador);

  const nome = primeiroNome(cuidador?.nome);
  const descricao = `${nome ? `Olá, ${nome}!` : 'Olá!'} Acompanhe aqui os alunos vinculados a você.`;

  if (error) {
    return (
      <>
        <PageHeader titulo="Início" descricao={descricao} />
        <div className="card">
          <StateMessage icon={CircleAlert} tone="erro" title="Não foi possível carregar o painel" action={<Button onClick={reload}>Tentar novamente</Button>}>
            {error.message}
          </StateMessage>
        </div>
      </>
    );
  }

  const indicadores = data?.indicadores;
  const fixados = data?.alunosFixados ?? [];
  const escola = indicadores?.escola;
  const local = escola ? [[escola.municipio, escola.estado].filter(Boolean).join(', '), escola.telefone].filter(Boolean).join(' · ') : '';

  return (
    <>
      <PageHeader titulo="Início" descricao={descricao} />

      <section className="stats" aria-label="Resumo" aria-busy={loading}>
        <StatCard rotulo="Alunos vinculados" valor={loading ? '–' : indicadores.alunosVinculados} icon={User} />
        <StatCard rotulo="Relatórios feitos" valor={loading ? '–' : indicadores.relatoriosFeitos} icon={ClipboardList} />
        <div className="card stat stat--escola">
          <span className="stat__icon">
            <Building2 size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="stat__label">Escola vinculada</p>
            <p className="stat__escola">{loading ? '–' : escola.razaoSocial}</p>
            {!loading && local && <p className="stat__sub">{local}</p>}
          </div>
        </div>
      </section>

      <section className="card list-card" aria-labelledby="titulo-fixados">
        <h2 id="titulo-fixados">Alunos fixados</h2>
        <p className="card__desc">Alunos que você marcou como prioritários e precisam de mais atenção.</p>
        {loading ? (
          <p role="status">Carregando…</p>
        ) : fixados.length === 0 ? (
          <StateMessage icon={Pin} title="Nenhum aluno fixado" action={<Button to="/alunos">Ir para Aluno</Button>}>
            Fixe alunos na página Aluno para vê-los aqui.
          </StateMessage>
        ) : (
          <ul className="simple-list">
            {fixados.map((a) => (
              <li key={a._id}>
                <Link to="/alunos" className="fixado-link" aria-label={`${a.nome}, ver na página Aluno`}>
                  <Avatar nome={a.nome} />
                  <div className="fixado-link__texto">
                    <p className="simple-list__title">{a.nome}</p>
                    <p className="simple-list__sub">
                      {a.turma ? `${a.turma} · ` : ''}Status: {rotuloSituacao(a.situacao)}
                    </p>
                  </div>
                  <span className="badge badge--fixado">
                    <Pin size={14} aria-hidden="true" /> Fixado
                  </span>
                  <ChevronRight size={20} aria-hidden="true" className="fixado-link__seta" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
