import { useMemo, useState } from 'react';
import { CircleAlert, Search, User } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import SearchField from '../components/SearchField.jsx';
import SelectField from '../components/SelectField.jsx';
import Avatar from '../components/Avatar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import RowActions from '../components/RowActions.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Pagination from '../components/Pagination.jsx';
import StateMessage from '../components/StateMessage.jsx';
import TableSkeleton from '../components/TableSkeleton.jsx';
import { useApiData } from '../hooks/useApiData.js';
import { useGerenciarRegistro } from '../hooks/useGerenciarRegistro.js';
import { atualizarAluno, excluirAluno, listarAlunos } from '../services/api.js';
import { plural } from '../utils/format.js';

const POR_PAGINA = 10;
const COLUNAS = { grid: '2fr 1.5fr 1fr 2.6fr', titulos: ['Aluno', 'Cuidador', 'Status', 'Ações'] };
const normalizar = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function AlunosPage() {
  const { data: alunos, loading, error, reload } = useApiData(listarAlunos);
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('todos');
  const [pagina, setPagina] = useState(1);

  const acoes = useGerenciarRegistro({
    tituloSalvo: 'Aluno salvo',
    atualizar: atualizarAluno,
    excluir: excluirAluno,
    aoMudar: reload,
  });

  const filtrados = useMemo(
    () =>
      (alunos ?? []).filter(
        (a) =>
          normalizar(a.nome).includes(normalizar(busca.trim())) &&
          (status === 'todos' || (status === 'ativo') === a.ativo),
      ),
    [alunos, busca, status],
  );

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);
  const temFiltro = busca !== '' || status !== 'todos';
  const limpar = () => {
    setBusca('');
    setStatus('todos');
    setPagina(1);
  };

  let corpo;
  if (loading) corpo = <TableSkeleton colunas={COLUNAS} rotulo="Carregando alunos" />;
  else if (error)
    corpo = (
      <div className="card">
        <StateMessage icon={CircleAlert} tone="erro" title="Não foi possível carregar os alunos" action={<Button onClick={reload}>Tentar novamente</Button>}>
          Verifique a conexão e tente novamente.
        </StateMessage>
      </div>
    );
  else if (alunos.length === 0)
    corpo = (
      <div className="card">
        <StateMessage icon={User} title="Nenhum aluno cadastrado ainda" action={<Button to="/alunos/novo">Adicionar aluno</Button>}>
          Quando você adicionar um aluno, ele aparece aqui.
        </StateMessage>
      </div>
    );
  else if (filtrados.length === 0)
    corpo = (
      <div className="card">
        <StateMessage icon={Search} title="Nenhum aluno encontrado" action={<Button variant="secondary" onClick={limpar}>Limpar filtros</Button>}>
          Tente outro nome ou limpe os filtros para ver todos os alunos.
        </StateMessage>
      </div>
    );
  else
    corpo = (
      <>
        <div className="table-wrap">
          <div className="table-head" style={{ gridTemplateColumns: COLUNAS.grid }}>
            {COLUNAS.titulos.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          {visiveis.map((a) => (
            <div className="table-row" style={{ gridTemplateColumns: COLUNAS.grid }} key={a._id}>
              <span className="cell-person">
                <Avatar nome={a.nome} />
                <strong>{a.nome}</strong>
              </span>
              <span>{a.cuidador?.nome ?? '—'}</span>
              <span>
                <StatusBadge ativo={a.ativo} />
              </span>
              <RowActions
                nome={a.nome}
                editarTo={`/alunos/${a._id}/editar`}
                ativo={a.ativo}
                ocupado={acoes.ocupadoId === a._id}
                onAlternarStatus={() => acoes.alternarStatus(a)}
                onExcluir={() => acoes.pedirExclusao(a)}
              />
            </div>
          ))}
        </div>
        <Pagination pagina={paginaAtual} totalPaginas={totalPaginas} onChange={setPagina} />
      </>
    );

  return (
    <>
      <PageHeader titulo="Alunos" descricao="Consulte e gerencie os alunos da sua escola." acao={<Button to="/alunos/novo">Adicionar aluno</Button>} />

      {acoes.aviso && (
        <Alert tipo={acoes.aviso.tipo} titulo={acoes.aviso.titulo} onClose={acoes.fecharAviso}>
          <p>{acoes.aviso.texto}</p>
        </Alert>
      )}

      <div className="filters">
        <SearchField id="busca-aluno" label="Buscar aluno" placeholder="Digite o nome" value={busca} onChange={(v) => { setBusca(v); setPagina(1); }} className="filters__grow" />
        <SelectField id="status-aluno" label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPagina(1); }}>
          <option value="todos">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </SelectField>
        <button type="button" className="link-btn" onClick={limpar} disabled={!temFiltro}>
          Limpar filtros
        </button>
      </div>

      {!loading && !error && alunos.length > 0 && (
        <p className="count" aria-live="polite">Mostrando {plural(filtrados.length, 'aluno', 'alunos')}</p>
      )}
      {corpo}

      <ConfirmDialog
        aberto={Boolean(acoes.alvo)}
        titulo={`Excluir ${acoes.alvo?.nome ?? 'aluno'}?`}
        erro={acoes.erroExclusao}
        carregando={acoes.excluindo}
        onConfirmar={acoes.confirmarExclusao}
        onCancelar={acoes.cancelarExclusao}
      >
        <p>
          O cadastro de <strong>{acoes.alvo?.nome}</strong> será removido e esta ação não pode ser desfeita.
          Para apenas impedir o uso, use <strong>Desativar</strong>.
        </p>
      </ConfirmDialog>
    </>
  );
}
