import { useMemo, useState } from 'react';
import { CircleAlert, Search, Users } from 'lucide-react';
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
import { atualizarCuidador, excluirCuidador, listarAlunos, listarCuidadores } from '../services/api.js';
import { plural } from '../utils/format.js';

const POR_PAGINA = 10;
const COLUNAS = { grid: '1.6fr 2fr 1.1fr 1fr 2.6fr', titulos: ['Cuidador', 'E-mail', 'Alunos vinculados', 'Status', 'Ações'] };
const normalizar = (t) => t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const carregar = () => Promise.all([listarCuidadores(), listarAlunos()]);

export default function CuidadoresPage() {
  const { data, loading, error, reload } = useApiData(carregar);
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState('todos');
  const [pagina, setPagina] = useState(1);

  const acoes = useGerenciarRegistro({
    tituloSalvo: 'Cuidador salvo',
    atualizar: atualizarCuidador,
    excluir: excluirCuidador,
    aoMudar: reload,
  });

  const [cuidadores, alunos] = data ?? [[], []];
  const vinculados = (id) => alunos.filter((a) => a.cuidador?._id === id).length;

  const filtrados = useMemo(
    () =>
      cuidadores.filter(
        (c) =>
          normalizar(c.nome).includes(normalizar(busca.trim())) &&
          (status === 'todos' || (status === 'ativo') === c.ativo),
      ),
    [cuidadores, busca, status],
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
  const adicionar = <Button to="/cuidadores/novo">Adicionar cuidador</Button>;

  let corpo;
  if (loading) corpo = <TableSkeleton colunas={COLUNAS} rotulo="Carregando cuidadores" />;
  else if (error)
    corpo = (
      <div className="card">
        <StateMessage icon={CircleAlert} tone="erro" title="Não foi possível carregar os cuidadores" action={<Button onClick={reload}>Tentar novamente</Button>}>
          Verifique a conexão e tente novamente.
        </StateMessage>
      </div>
    );
  else if (cuidadores.length === 0)
    corpo = (
      <div className="card">
        <StateMessage icon={Users} title="Nenhum cuidador cadastrado ainda" action={adicionar}>
          Quando você adicionar um cuidador, ele aparece aqui.
        </StateMessage>
      </div>
    );
  else if (filtrados.length === 0)
    corpo = (
      <div className="card">
        <StateMessage icon={Search} title="Nenhum cuidador encontrado" action={<Button variant="secondary" onClick={limpar}>Limpar filtros</Button>}>
          Tente outro nome ou limpe os filtros para ver todos os cuidadores.
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
          {visiveis.map((c) => (
            <div className="table-row" style={{ gridTemplateColumns: COLUNAS.grid }} key={c._id}>
              <span className="cell-person">
                <Avatar nome={c.nome} />
                <strong>{c.nome}</strong>
              </span>
              <span className="cell-wrap">{c.email}</span>
              <span>{plural(vinculados(c._id), 'aluno', 'alunos')}</span>
              <span>
                <StatusBadge ativo={c.ativo} />
              </span>
              <RowActions
                nome={c.nome}
                editarTo={`/cuidadores/${c._id}/editar`}
                ativo={c.ativo}
                ocupado={acoes.ocupadoId === c._id}
                onAlternarStatus={() => acoes.alternarStatus(c)}
                onExcluir={() => acoes.pedirExclusao(c)}
              />
            </div>
          ))}
        </div>
        <Pagination pagina={paginaAtual} totalPaginas={totalPaginas} onChange={setPagina} />
      </>
    );

  return (
    <>
      <PageHeader titulo="Cuidadores" descricao="Acompanhe os cuidadores vinculados à sua escola." acao={adicionar} />

      {acoes.aviso && (
        <Alert tipo={acoes.aviso.tipo} titulo={acoes.aviso.titulo} onClose={acoes.fecharAviso}>
          <p>{acoes.aviso.texto}</p>
        </Alert>
      )}

      <div className="filters">
        <SearchField id="busca-cuidador" label="Buscar cuidador" placeholder="Digite o nome do cuidador" value={busca} onChange={(v) => { setBusca(v); setPagina(1); }} className="filters__grow" />
        <SelectField id="status-cuidador" label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPagina(1); }}>
          <option value="todos">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </SelectField>
        <button type="button" className="link-btn" onClick={limpar} disabled={!temFiltro}>
          Limpar filtros
        </button>
      </div>

      {!loading && !error && cuidadores.length > 0 && (
        <p className="count" aria-live="polite">Mostrando {plural(filtrados.length, 'cuidador', 'cuidadores')}</p>
      )}
      {corpo}

      <ConfirmDialog
        aberto={Boolean(acoes.alvo)}
        titulo={`Excluir ${acoes.alvo?.nome ?? 'cuidador'}?`}
        erro={acoes.erroExclusao}
        carregando={acoes.excluindo}
        onConfirmar={acoes.confirmarExclusao}
        onCancelar={acoes.cancelarExclusao}
      >
        <p>
          O cadastro de <strong>{acoes.alvo?.nome}</strong> será removido e esta ação não pode ser desfeita.
          Cuidadores com alunos vinculados só podem ser excluídos depois que os alunos forem reatribuídos.
        </p>
      </ConfirmDialog>
    </>
  );
}
