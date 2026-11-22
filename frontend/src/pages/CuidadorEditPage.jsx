import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import TextField from '../components/TextField.jsx';
import StatusField from '../components/StatusField.jsx';
import ResumoErros from '../components/ResumoErros.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import StateMessage from '../components/StateMessage.jsx';
import Button from '../components/Button.jsx';
import { useApiData } from '../hooks/useApiData.js';
import { atualizarCuidador, buscarCuidador, excluirCuidador, listarAlunos } from '../services/api.js';
import { apenasDigitos, emailValido, mascararTelefone, plural } from '../utils/format.js';

const ROTULOS = { nome: 'Nome completo', email: 'E-mail', telefone: 'Telefone', senha: 'Nova senha' };
const bytes = (texto) => new TextEncoder().encode(texto).length;
const carregar = (id) => () => Promise.all([buscarCuidador(id), listarAlunos()]);

// A `key={id}` recria o carregamento caso o id da URL mude com a página já aberta.
export default function CuidadorEditPage() {
  const { id } = useParams();
  return <Carregador key={id} id={id} />;
}

function Carregador({ id }) {
  const { data, loading, error, reload } = useApiData(carregar(id));
  const cabecalho = (
    <>
      <Breadcrumb pai={{ to: '/cuidadores', label: 'Cuidadores' }} atual="Editar cuidador" />
      <PageHeader titulo="Editar cuidador" descricao="Altere os dados abaixo. A senha só muda se você preencher o campo de nova senha." />
    </>
  );

  if (loading) {
    return (
      <>
        {cabecalho}
        <p role="status">Carregando cuidador…</p>
      </>
    );
  }
  if (error) {
    const naoEncontrado = error.status === 404;
    return (
      <>
        {cabecalho}
        <div className="card">
          <StateMessage
            icon={CircleAlert}
            tone="erro"
            title={naoEncontrado ? 'Cuidador não encontrado' : 'Não foi possível carregar o cuidador'}
            action={naoEncontrado ? <Button to="/cuidadores">Voltar para cuidadores</Button> : <Button onClick={reload}>Tentar novamente</Button>}
          >
            {naoEncontrado ? 'Ele pode ter sido excluído.' : error.message}
          </StateMessage>
        </div>
      </>
    );
  }
  const vinculados = data[1].filter((a) => a.cuidador?._id === data[0]._id).length;
  return (
    <>
      {cabecalho}
      <Formulario cuidador={data[0]} vinculados={vinculados} />
    </>
  );
}

function Formulario({ cuidador, vinculados }) {
  const navigate = useNavigate();
  const [f, setF] = useState({
    nome: cuidador.nome ?? '',
    email: cuidador.email ?? '',
    telefone: mascararTelefone(cuidador.telefone ?? ''),
    ativo: cuidador.ativo,
    senha: '',
  });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const [salvando, setSalvando] = useState(false);

  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState('');

  const set = (campo) => (e) => setF((s) => ({ ...s, [campo]: e.target.value }));

  // Só o que mudou é enviado. Senha vazia = manter a atual.
  const mudancas = {};
  if (f.nome.trim() !== cuidador.nome) mudancas.nome = f.nome.trim();
  if (f.email.trim().toLowerCase() !== cuidador.email) mudancas.email = f.email.trim();
  if (apenasDigitos(f.telefone) !== apenasDigitos(cuidador.telefone ?? '')) mudancas.telefone = f.telefone;
  if (f.ativo !== cuidador.ativo) mudancas.ativo = f.ativo;
  if (f.senha) mudancas.senha = f.senha;
  const temMudancas = Object.keys(mudancas).length > 0;

  function validar() {
    const e = {};
    if (!f.nome.trim()) e.nome = 'Digite o nome do cuidador.';
    if (!emailValido(f.email)) e.email = 'Digite um e-mail válido, como nome@exemplo.com.';
    if (apenasDigitos(f.telefone).length < 8) e.telefone = 'Digite o telefone com DDD.';
    if (f.senha && f.senha.length < 8) e.senha = 'Use no mínimo 8 caracteres.';
    else if (bytes(f.senha) > 72) e.senha = 'Use no máximo 72 bytes (evite senhas muito longas).';
    return e;
  }

  async function salvar(ev) {
    ev.preventDefault();
    setErroGeral('');
    const e = validar();
    setErros(e);
    if (Object.keys(e).length) {
      setTentativa((n) => n + 1);
      return;
    }
    setSalvando(true);
    try {
      await atualizarCuidador(cuidador._id, mudancas);
      navigate('/cuidadores', { state: { aviso: { tipo: 'sucesso', titulo: 'Cuidador atualizado', texto: `Os dados de ${f.nome.trim()} foram salvos.` } } });
    } catch (err) {
      const doServidor = {};
      err.erros.forEach(({ campo, mensagem }) => {
        if (campo in ROTULOS) doServidor[campo] = mensagem;
      });
      if (err.status === 409) doServidor.email = err.message;
      setErros(doServidor);
      if (Object.keys(doServidor).length === 0) setErroGeral(err.message);
      else setTentativa((n) => n + 1);
      setSalvando(false);
    }
  }

  async function excluir() {
    setExcluindo(true);
    setErroExclusao('');
    try {
      await excluirCuidador(cuidador._id);
      navigate('/cuidadores', { state: { aviso: { tipo: 'sucesso', titulo: 'Cuidador excluído', texto: `${cuidador.nome} foi excluído.` } } });
    } catch (err) {
      setErroExclusao(err.message); // 409: ainda há alunos vinculados
      setExcluindo(false);
    }
  }

  return (
    <>
      <ResumoErros erros={erros} rotulos={ROTULOS} tentativa={tentativa} entidade="o cuidador">
        {erroGeral && <div role="alert" className="alert alert--erro"><CircleAlert size={20} aria-hidden="true" className="alert__icon" /><div className="alert__body"><p className="alert__title">Não foi possível salvar o cuidador</p><p>{erroGeral}</p></div></div>}
      </ResumoErros>

      <form onSubmit={salvar} noValidate>
        <div className="form-cards">
          <section className="card form-card">
            <h2>Dados do cuidador</h2>
            <TextField id="nome" label="Nome completo (obrigatório)" value={f.nome} onChange={set('nome')} error={erros.nome} autoComplete="off" />
            <TextField id="email" label="E-mail (obrigatório)" type="email" value={f.email} onChange={set('email')} error={erros.email} autoComplete="off" />
            <TextField id="telefone" label="Telefone (obrigatório)" inputMode="tel" hint="Inclua o DDD." value={f.telefone} onChange={(e) => setF((s) => ({ ...s, telefone: mascararTelefone(e.target.value) }))} error={erros.telefone} autoComplete="off" />
          </section>

          <section className="card form-card">
            <h2>Acesso e status</h2>
            <TextField id="senha" label="Nova senha (opcional)" type="password" placeholder="Digite apenas para trocar" hint="Deixe em branco para manter a senha atual. Mínimo de 8 caracteres." value={f.senha} onChange={set('senha')} error={erros.senha} autoComplete="new-password" />
            <StatusField valor={f.ativo} onChange={(ativo) => setF((s) => ({ ...s, ativo }))} descricao="Cuidador inativo não pode ser escolhido como cuidador principal de novos alunos." />
          </section>
        </div>

        <div className="form-actions">
          <Button type="submit" disabled={salvando || !temMudancas}>{salvando ? 'Salvando…' : 'Salvar alterações'}</Button>
          <Button variant="secondary" to="/cuidadores">Cancelar</Button>
          {!temMudancas && <p className="field__hint form-actions__hint">Nenhuma alteração para salvar.</p>}
        </div>
      </form>

      <section className="card danger-zone" aria-labelledby="titulo-excluir">
        <div>
          <h2 id="titulo-excluir">Excluir cuidador</h2>
          <p className="card__desc">
            {vinculados > 0
              ? `Este cuidador tem ${plural(vinculados, 'aluno vinculado', 'alunos vinculados')}. Reatribua-os a outro cuidador antes de excluir.`
              : `Remove o cadastro de ${cuidador.nome}. Esta ação não pode ser desfeita.`}
          </p>
        </div>
        <Button variant="danger" onClick={() => { setErroExclusao(''); setConfirmando(true); }}>Excluir cuidador</Button>
      </section>

      <ConfirmDialog aberto={confirmando} titulo={`Excluir ${cuidador.nome}?`} erro={erroExclusao} carregando={excluindo} onConfirmar={excluir} onCancelar={() => setConfirmando(false)}>
        <p>O cadastro será removido e esta ação não pode ser desfeita. Para apenas impedir o uso, mude o status para <strong>Inativo</strong>.</p>
      </ConfirmDialog>
    </>
  );
}
