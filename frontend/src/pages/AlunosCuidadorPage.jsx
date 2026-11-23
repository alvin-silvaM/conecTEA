import { useState } from 'react';
import { CircleAlert, Pin, Search } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import SearchField from '../components/SearchField.jsx';
import Avatar from '../components/Avatar.jsx';
import SituacaoBadge from '../components/SituacaoBadge.jsx';
import StateMessage from '../components/StateMessage.jsx';
import TableSkeleton from '../components/TableSkeleton.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { useApiData } from '../hooks/useApiData.js';
import { buscarPainelAlunos, desafixarAluno, fixarAluno } from '../services/api.js';

const COLUNAS_VINCULADOS = { grid: '2fr 1.5fr 1fr 1.3fr', titulos: ['Aluno', 'Cuidador', 'Status', 'Ação'] };
const COLUNAS_DEMAIS = { grid: '2fr 1.5fr 1fr', titulos: ['Aluno', 'Cuidador', 'Situação'] };
const normalizar = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function Cabecalho({ colunas }) {
  return (
    <div className="table-head" style={{ gridTemplateColumns: colunas.grid }}>
      {colunas.titulos.map((t) => (
        <span key={t}>{t}</span>
      ))}
    </div>
  );
}

// Tela Aluno do cuidador: os alunos dele (pode fixar) e os demais da escola (só consulta)
export default function AlunosCuidadorPage() {
  const { sair } = useAuth();
  const { data: painel, loading, error, reload } = useApiData(buscarPainelAlunos);
  const [busca, setBusca] = useState('');
  const [aviso, setAviso] = useState(null);
  const [ocupadoId, setOcupadoId] = useState(null);

  const termo = normalizar(busca.trim());
  const casa = (a) => !termo || normalizar(`${a.nome} ${a.cuidador?.nome ?? ''}`).includes(termo);
  const vinculados = (painel?.vinculados ?? []).filter(casa);
  const demais = (painel?.demais ?? []).filter(casa);

  async function alternarFixacao(aluno) {
    setOcupadoId(aluno._id);
    setAviso(null);
    try {
      await (aluno.fixado ? desafixarAluno : fixarAluno)(aluno._id);
      setAviso({
        tipo: 'sucesso',
        titulo: aluno.fixado ? 'Aluno desafixado' : 'Aluno fixado',
        texto: aluno.fixado
          ? `${aluno.nome} saiu da lista de fixados na página Início.`
          : `${aluno.nome} aparece agora na página Início.`,
      });
      reload();
    } catch (erro) {
      if (erro.status === 401) sair();
      setAviso({ tipo: 'erro', titulo: 'Não foi possível alterar a fixação', texto: erro.message });
      if (erro.status === 404) reload(); // o aluno pode ter sido reatribuído
    } finally {
      setOcupadoId(null);
    }
  }

  let corpo;
  if (loading && !painel) {
    corpo = <TableSkeleton colunas={COLUNAS_VINCULADOS} rotulo="Carregando alunos" />;
  } else if (error) {
    corpo = (
      <div className="card">
        <StateMessage icon={CircleAlert} tone="erro" title="Não foi possível carregar os alunos" action={<Button onClick={reload}>Tentar novamente</Button>}>
          {error.message}
        </StateMessage>
      </div>
    );
  } else {
    const semResultado = (padrao) => (termo ? 'Nenhum aluno encontrado para essa busca.' : padrao);
    corpo = (
      <>
        <section className="secao-aluno" aria-labelledby="titulo-vinculados">
          <h2 id="titulo-vinculados">Alunos vinculados a você ({painel.vinculados.length})</h2>
          <p className="card__desc">Você pode fixar estes alunos para vê-los na página Início.</p>
          {vinculados.length === 0 ? (
            <div className="card">
              <p className="card__empty card__empty--tabela">{semResultado('Quando a escola vincular alunos a você, eles aparecem aqui.')}</p>
            </div>
          ) : (
            <div className="table-wrap">
              <Cabecalho colunas={COLUNAS_VINCULADOS} />
              {vinculados.map((a) => (
                <div className="table-row" style={{ gridTemplateColumns: COLUNAS_VINCULADOS.grid }} key={a._id}>
                  <span className="cell-person">
                    <Avatar nome={a.nome} />
                    <strong>{a.nome}</strong>
                  </span>
                  <span>{a.cuidador?.nome ?? '—'}</span>
                  <span>
                    <SituacaoBadge situacao={a.situacao} />
                  </span>
                  <span>
                    <button
                      type="button"
                      className={a.fixado ? 'pin-btn' : 'btn btn--secondary btn--sm'}
                      aria-label={`${a.fixado ? 'Desafixar' : 'Fixar'} ${a.nome}`}
                      disabled={ocupadoId === a._id}
                      onClick={() => alternarFixacao(a)}
                    >
                      {a.fixado ? (
                        <>
                          <Pin size={14} aria-hidden="true" /> Fixado
                        </>
                      ) : (
                        'Fixar aluno'
                      )}
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="secao-aluno" aria-labelledby="titulo-demais">
          <h2 id="titulo-demais">Demais alunos cadastrados ({painel.demais.length})</h2>
          <p className="card__desc">Estes alunos não estão vinculados a você. Você pode consultá-los, mas não pode fixá-los.</p>
          {demais.length === 0 ? (
            <div className="card">
              <p className="card__empty card__empty--tabela">{semResultado('Não há outros alunos cadastrados na escola.')}</p>
            </div>
          ) : (
            <div className="table-wrap">
              <Cabecalho colunas={COLUNAS_DEMAIS} />
              {demais.map((a) => (
                <div className="table-row" style={{ gridTemplateColumns: COLUNAS_DEMAIS.grid }} key={a._id}>
                  <span className="cell-person cell-person--neutro">
                    <Avatar nome={a.nome} />
                    <strong>{a.nome}</strong>
                  </span>
                  <span>{a.cuidador?.nome ?? '—'}</span>
                  <span>
                    <SituacaoBadge situacao={a.situacao} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader titulo="Aluno" descricao="Consulte os alunos e fixe os que precisam de mais atenção." />

      {aviso && (
        <Alert tipo={aviso.tipo} titulo={aviso.titulo} onClose={() => setAviso(null)}>
          <p>{aviso.texto}</p>
        </Alert>
      )}

      <div className="filters">
        <SearchField id="busca-aluno" label="Buscar aluno" placeholder="Buscar aluno..." value={busca} onChange={setBusca} className="filters__grow" />
      </div>

      <div className="secoes-aluno">{corpo}</div>
    </>
  );
}
