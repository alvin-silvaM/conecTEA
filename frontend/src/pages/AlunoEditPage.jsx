import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CircleAlert } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import TextField from '../components/TextField.jsx';
import SelectField from '../components/SelectField.jsx';
import StatusField from '../components/StatusField.jsx';
import ResumoErros from '../components/ResumoErros.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import StateMessage from '../components/StateMessage.jsx';
import Button from '../components/Button.jsx';
import { useApiData } from '../hooks/useApiData.js';
import { atualizarAluno, buscarAluno, excluirAluno, listarCuidadores } from '../services/api.js';
import { emailValido } from '../utils/format.js';

const ROTULOS = { nome: 'Nome completo', email: 'E-mail', dataNascimento: 'Data de nascimento', cuidador: 'Cuidador principal', senha: 'Nova senha' };
const bytes = (texto) => new TextEncoder().encode(texto).length;
const dataDe = (iso) => (iso ? iso.slice(0, 10) : '');
const carregar = (id) => () => Promise.all([buscarAluno(id), listarCuidadores()]);

// A `key={id}` recria o carregamento caso o id da URL mude com a página já aberta.
export default function AlunoEditPage() {
  const { id } = useParams();
  return <Carregador key={id} id={id} />;
}

function Carregador({ id }) {
  const { data, loading, error, reload } = useApiData(carregar(id));
  const cabecalho = (
    <>
      <Breadcrumb pai={{ to: '/alunos', label: 'Alunos' }} atual="Editar aluno" />
      <PageHeader titulo="Editar aluno" descricao="Altere os dados abaixo. A senha só muda se você preencher o campo de nova senha." />
    </>
  );

  if (loading) {
    return (
      <>
        {cabecalho}
        <p role="status">Carregando aluno…</p>
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
            title={naoEncontrado ? 'Aluno não encontrado' : 'Não foi possível carregar o aluno'}
            action={naoEncontrado ? <Button to="/alunos">Voltar para alunos</Button> : <Button onClick={reload}>Tentar novamente</Button>}
          >
            {naoEncontrado ? 'Ele pode ter sido excluído.' : error.message}
          </StateMessage>
        </div>
      </>
    );
  }
  return (
    <>
      {cabecalho}
      <Formulario aluno={data[0]} cuidadores={data[1]} />
    </>
  );
}

function Formulario({ aluno, cuidadores }) {
  const navigate = useNavigate();
  const [f, setF] = useState({
    nome: aluno.nome ?? '',
    email: aluno.email ?? '',
    dataNascimento: dataDe(aluno.dataNascimento),
    cuidador: aluno.cuidador?._id ?? '',
    ativo: aluno.ativo,
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
  const hoje = new Date().toISOString().slice(0, 10);

  // O PATCH aceita atualização parcial: enviamos só o que mudou.
  // A senha só entra se algo foi digitado (campo vazio = manter a atual).
  const mudancas = {};
  if (f.nome.trim() !== aluno.nome) mudancas.nome = f.nome.trim();
  if (f.email.trim() && f.email.trim().toLowerCase() !== aluno.email) mudancas.email = f.email.trim();
  if (f.dataNascimento && f.dataNascimento !== dataDe(aluno.dataNascimento)) mudancas.dataNascimento = f.dataNascimento;
  if (f.cuidador && f.cuidador !== aluno.cuidador?._id) mudancas.cuidador = f.cuidador;
  if (f.ativo !== aluno.ativo) mudancas.ativo = f.ativo;
  if (f.senha) mudancas.senha = f.senha;
  const temMudancas = Object.keys(mudancas).length > 0;

  // Cuidadores ativos + o cuidador atual do aluno (mesmo que esteja inativo), para aparecer selecionado
  const opcoes = cuidadores.filter((c) => c.ativo || c._id === aluno.cuidador?._id);

  function validar() {
    const e = {};
    if (!f.nome.trim()) e.nome = 'Digite o nome do aluno.';
    if (!f.email.trim()) {
      if (aluno.email) e.email = 'Digite o e-mail do aluno.';
    } else if (!emailValido(f.email)) e.email = 'Digite um e-mail válido, como nome@exemplo.com.';
    if (f.dataNascimento > hoje) e.dataNascimento = 'A data de nascimento não pode ser futura.';
    if (!f.cuidador) e.cuidador = 'Escolha o cuidador principal.';
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
      await atualizarAluno(aluno._id, mudancas);
      navigate('/alunos', { state: { aviso: { tipo: 'sucesso', titulo: 'Aluno atualizado', texto: `Os dados de ${f.nome.trim()} foram salvos.` } } });
    } catch (err) {
      const doServidor = {};
      err.erros.forEach(({ campo, mensagem }) => {
        if (campo in ROTULOS) doServidor[campo] = mensagem;
      });
      if (err.status === 409) doServidor.email = err.message;
      if (err.message === 'Cuidador inválido') doServidor.cuidador = 'Escolha um cuidador ativo.';
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
      await excluirAluno(aluno._id);
      navigate('/alunos', { state: { aviso: { tipo: 'sucesso', titulo: 'Aluno excluído', texto: `${aluno.nome} foi excluído.` } } });
    } catch (err) {
      setErroExclusao(err.message);
      setExcluindo(false);
    }
  }

  return (
    <>
      <ResumoErros erros={erros} rotulos={ROTULOS} tentativa={tentativa} entidade="o aluno">
        {erroGeral && <div role="alert" className="alert alert--erro"><CircleAlert size={20} aria-hidden="true" className="alert__icon" /><div className="alert__body"><p className="alert__title">Não foi possível salvar o aluno</p><p>{erroGeral}</p></div></div>}
      </ResumoErros>

      <form onSubmit={salvar} noValidate>
        <div className="form-cards">
          <section className="card form-card">
            <h2>Dados do aluno</h2>
            <TextField id="nome" label="Nome completo (obrigatório)" value={f.nome} onChange={set('nome')} error={erros.nome} autoComplete="off" />
            <TextField id="email" label="E-mail do aluno" type="email" hint="O aluno usa este e-mail para entrar no comunicador." value={f.email} onChange={set('email')} error={erros.email} autoComplete="off" />
            <TextField id="dataNascimento" label="Data de nascimento (opcional)" type="date" max={hoje} value={f.dataNascimento} onChange={set('dataNascimento')} error={erros.dataNascimento} />
            <SelectField id="cuidador" label="Cuidador principal (obrigatório)" value={f.cuidador} onChange={set('cuidador')} error={erros.cuidador}>
              {!f.cuidador && <option value="">Selecione um cuidador</option>}
              {opcoes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.nome}{c.ativo ? '' : ' (inativo)'}
                </option>
              ))}
            </SelectField>
          </section>

          <section className="card form-card">
            <h2>Acesso e status</h2>
            <TextField id="senha" label="Nova senha (opcional)" type="password" placeholder="Digite apenas para trocar" hint="Deixe em branco para manter a senha atual. Mínimo de 8 caracteres." value={f.senha} onChange={set('senha')} error={erros.senha} autoComplete="new-password" />
            <StatusField valor={f.ativo} onChange={(ativo) => setF((s) => ({ ...s, ativo }))} descricao="Aluno inativo continua cadastrado, mas deixa de aparecer como ativo." />
          </section>
        </div>

        <div className="form-actions">
          <Button type="submit" disabled={salvando || !temMudancas}>{salvando ? 'Salvando…' : 'Salvar alterações'}</Button>
          <Button variant="secondary" to="/alunos">Cancelar</Button>
          {!temMudancas && <p className="field__hint form-actions__hint">Nenhuma alteração para salvar.</p>}
        </div>
      </form>

      <section className="card danger-zone" aria-labelledby="titulo-excluir">
        <div>
          <h2 id="titulo-excluir">Excluir aluno</h2>
          <p className="card__desc">Remove o cadastro de {aluno.nome}. Esta ação não pode ser desfeita.</p>
        </div>
        <Button variant="danger" onClick={() => { setErroExclusao(''); setConfirmando(true); }}>Excluir aluno</Button>
      </section>

      <ConfirmDialog aberto={confirmando} titulo={`Excluir ${aluno.nome}?`} erro={erroExclusao} carregando={excluindo} onConfirmar={excluir} onCancelar={() => setConfirmando(false)}>
        <p>O cadastro será removido e esta ação não pode ser desfeita. Para apenas impedir o uso, mude o status para <strong>Inativo</strong>.</p>
      </ConfirmDialog>
    </>
  );
}
