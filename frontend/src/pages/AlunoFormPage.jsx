import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import TextField from '../components/TextField.jsx';
import SelectField from '../components/SelectField.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import { useApiData } from '../hooks/useApiData.js';
import { criarAluno, listarCuidadores } from '../services/api.js';
import { emailValido } from '../utils/format.js';

const bytes = (texto) => new TextEncoder().encode(texto).length;
export default function AlunoFormPage() {
  const navigate = useNavigate();
  const { data: cuidadores, loading, error: erroCarga, reload } = useApiData(listarCuidadores);
  const [f, setF] = useState({ nome: '', email: '', senha: '', dataNascimento: '', cuidador: '' });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  const ativos = (cuidadores ?? []).filter((c) => c.ativo);
  const set = (campo) => (e) => setF((s) => ({ ...s, [campo]: e.target.value }));
  const hoje = new Date().toISOString().slice(0, 10);

  async function enviar(ev) {
    ev.preventDefault();
    setErroGeral('');
    const e = {};
    if (f.nome.trim().split(/\s+/).filter(Boolean).length < 2) e.nome = 'Digite o nome completo do aluno.';
    if (!emailValido(f.email)) e.email = 'Digite um e-mail válido, como nome@exemplo.com.';
    if (f.senha.length < 8) e.senha = 'Use no mínimo 8 caracteres.';
    else if (bytes(f.senha) > 72) e.senha = 'Use no máximo 72 bytes (evite senhas muito longas).';
    if (!f.cuidador) e.cuidador = 'Escolha o cuidador principal.';
    if (f.dataNascimento && f.dataNascimento > hoje) e.dataNascimento = 'A data de nascimento não pode ser futura.';
    setErros(e);
    if (Object.keys(e).length) return;

    setEnviando(true);
    try {
      const corpo = { nome: f.nome.trim(), email: f.email.trim(), senha: f.senha, cuidador: f.cuidador };
      if (f.dataNascimento) corpo.dataNascimento = f.dataNascimento;
      const aluno = await criarAluno(corpo);
      navigate('/alunos', { state: { aviso: `${aluno.nome} foi adicionado à lista de alunos.` } });
    } catch (err) {
      const doServidor = {};
      err.erros.forEach(({ campo, mensagem }) => {
        if (campo in f) doServidor[campo] = mensagem;
      });
      if (err.message === 'Cuidador inválido') doServidor.cuidador = err.message;
      // 409 = conflito (e-mail já cadastrado)
      if (err.status === 409) doServidor.email = err.message;
      setErros(doServidor);
      if (Object.keys(doServidor).length === 0) setErroGeral(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <Breadcrumb pai={{ to: '/alunos', label: 'Alunos' }} atual="Adicionar aluno" />
      <PageHeader titulo="Adicionar aluno" descricao="Preencha os dados abaixo para cadastrar um aluno." />
      {erroGeral && <Alert titulo="Não foi possível salvar o aluno">{erroGeral}</Alert>}
      {erroCarga && (
        <Alert titulo="Não foi possível carregar os cuidadores">
          <button type="button" className="link-btn" onClick={reload}>Tentar novamente</button>
        </Alert>
      )}

      <form onSubmit={enviar} noValidate>
        <section className="card form-card form-card--single">
          <h2>Dados do aluno</h2>
          <TextField id="nome" label="Nome completo (obrigatório)" placeholder="Digite o nome completo" hint="Escreva o nome e o sobrenome do aluno." value={f.nome} onChange={set('nome')} error={erros.nome} autoComplete="off" />
          <TextField id="email" label="E-mail do aluno (obrigatório)" type="email" placeholder="Digite o e-mail" hint="O aluno usa este e-mail para entrar no comunicador." value={f.email} onChange={set('email')} error={erros.email} autoComplete="off" />
          <TextField id="senha" label="Senha do aluno (obrigatório)" type="password" placeholder="Crie uma senha" hint="Mínimo de 8 caracteres." value={f.senha} onChange={set('senha')} error={erros.senha} autoComplete="new-password" />
          <TextField id="dataNascimento" label="Data de nascimento (opcional)" type="date" max={hoje} value={f.dataNascimento} onChange={set('dataNascimento')} error={erros.dataNascimento} />
          <SelectField id="cuidador" label="Cuidador principal (obrigatório)" value={f.cuidador} onChange={set('cuidador')} error={erros.cuidador} disabled={loading}>
            <option value="">{loading ? 'Carregando…' : 'Selecione um cuidador'}</option>
            {ativos.map((c) => (
              <option key={c._id} value={c._id}>{c.nome}</option>
            ))}
          </SelectField>
          {!loading && !erroCarga && ativos.length === 0 && (
            <p className="field__hint">Nenhum cuidador ativo. <Link to="/cuidadores/novo">Adicione um cuidador</Link> antes de cadastrar o aluno.</p>
          )}
        </section>
        <div className="form-actions">
          <Button type="submit" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar aluno'}</Button>
          <Button variant="secondary" to="/alunos">Cancelar</Button>
        </div>
      </form>
    </>
  );
}