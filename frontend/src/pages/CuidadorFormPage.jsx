import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import TextField from '../components/TextField.jsx';
import CheckboxItem from '../components/CheckboxItem.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import { useApiData } from '../hooks/useApiData.js';
import { atualizarAluno, criarCuidador, listarAlunos } from '../services/api.js';
import { emailValido, mascararTelefone, apenasDigitos } from '../utils/format.js';

const ROTULOS = { nome: 'Nome completo', email: 'E-mail', telefone: 'Telefone', senha: 'Senha provisória' };

export default function CuidadorFormPage() {
  const navigate = useNavigate();
  const { data: alunos, loading, error: erroAlunos, reload } = useApiData(listarAlunos);

  const [f, setF] = useState({ nome: '', email: '', telefone: '', senha: '' });
  const [vinculos, setVinculos] = useState(new Set());
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  const resumoRef = useRef(null);
  const [tentativas, setTentativas] = useState(0);
  useEffect(() => {
    if (tentativas > 0) resumoRef.current?.focus();
  }, [tentativas]);

  const set = (campo) => (e) => setF((s) => ({ ...s, [campo]: e.target.value }));
  const alternar = (id, marcado) =>
    setVinculos((atual) => {
      const novo = new Set(atual);
      marcado ? novo.add(id) : novo.delete(id);
      return novo;
    });

  function validar() {
    const e = {};
    if (f.nome.trim().split(/\s+/).filter(Boolean).length < 2) e.nome = 'Digite o nome completo do cuidador.';
    if (!emailValido(f.email)) e.email = 'Digite um e-mail válido, como nome@exemplo.com.';
    if (apenasDigitos(f.telefone).length < 8) e.telefone = 'Digite o telefone com DDD.';
    if (f.senha.length < 8) e.senha = 'Use no mínimo 8 caracteres.';
    return e;
  }

  function irParaCampo(ev, campo) {
    ev.preventDefault();
    document.getElementById(campo)?.focus();
  }

  async function enviar(ev) {
    ev.preventDefault();
    setErroGeral('');
    const e = validar();
    setErros(e);
    if (Object.keys(e).length) {
      setTentativas((n) => n + 1);
      return;
    }

    setEnviando(true);
    let cuidador;
    try {
      cuidador = await criarCuidador({ nome: f.nome.trim(), email: f.email.trim(), telefone: f.telefone, senha: f.senha });
    } catch (err) {
      const doServidor = {};
      err.erros.forEach(({ campo, mensagem }) => {
        if (campo in ROTULOS) doServidor[campo] = mensagem;
      });
      if (err.status === 409) doServidor.email = err.message;
      setErros(doServidor);
      if (Object.keys(doServidor).length === 0) setErroGeral(err.message);
      else setTentativas((n) => n + 1);
      setEnviando(false);
      return;
    }

    const resultados = await Promise.allSettled([...vinculos].map((id) => atualizarAluno(id, { cuidador: cuidador._id })));
    const falhas = resultados.filter((r) => r.status === 'rejected').length;
    const aviso =
      falhas === 0
        ? `${cuidador.nome} foi adicionado à lista de cuidadores.`
        : `${cuidador.nome} foi adicionado, mas ${falhas} vínculo(s) com alunos não foram salvos. Tente vincular novamente depois.`;
    navigate('/cuidadores', { state: { aviso } });
  }

  const listaErros = Object.entries(erros);

  return (
    <>
      <Breadcrumb pai={{ to: '/cuidadores', label: 'Cuidadores' }} atual="Adicionar cuidador" />
      <PageHeader titulo="Adicionar cuidador" descricao="Preencha os dados abaixo para cadastrar um cuidador." />

      <div ref={resumoRef} tabIndex={-1} className="focus-target">
        {listaErros.length > 0 && (
          <Alert titulo={`Corrija ${listaErros.length} ${listaErros.length === 1 ? 'campo' : 'campos'} para salvar o cuidador`}>
            <ul className="alert__links">
              {listaErros.map(([campo, msg]) => (
                <li key={campo}>
                  <a href={`#${campo}`} onClick={(ev) => irParaCampo(ev, campo)}>
                    {ROTULOS[campo]}: {msg.charAt(0).toLowerCase() + msg.slice(1)}
                  </a>
                </li>
              ))}
            </ul>
          </Alert>
        )}
        {erroGeral && <Alert titulo="Não foi possível salvar o cuidador">{erroGeral}</Alert>}
      </div>

      <form onSubmit={enviar} noValidate>
        <div className="form-cards">
          <section className="card form-card">
            <h2>Dados do cuidador</h2>
            <TextField id="nome" label="Nome completo (obrigatório)" placeholder="Digite o nome completo" hint="Escreva o nome e o sobrenome do cuidador." value={f.nome} onChange={set('nome')} error={erros.nome} autoComplete="off" />
            <TextField id="email" label="E-mail (obrigatório)" type="email" placeholder="Digite o e-mail" hint="Exemplo: nome@exemplo.com" value={f.email} onChange={set('email')} error={erros.email} autoComplete="off" />
            <TextField id="telefone" label="Telefone (obrigatório)" inputMode="tel" placeholder="Digite o telefone" hint="Inclua o DDD." value={f.telefone} onChange={(e) => setF((s) => ({ ...s, telefone: mascararTelefone(e.target.value) }))} error={erros.telefone} autoComplete="off" />
            <TextField id="senha" label="Senha provisória (obrigatório)" type="password" placeholder="Crie uma senha" hint="Mínimo de 8 caracteres." value={f.senha} onChange={set('senha')} error={erros.senha} autoComplete="new-password" />
          </section>

          <section className="card form-card" aria-labelledby="titulo-vinculos">
            <h2 id="titulo-vinculos">Alunos vinculados (opcional)</h2>
            <p className="card__desc">Marque os alunos que este cuidador acompanha. Cada aluno tem um cuidador principal: os alunos marcados passam a ficar com este cuidador.</p>
            {loading && <p role="status">Carregando alunos…</p>}
            {erroAlunos && (
              <p>
                Não foi possível carregar os alunos. <button type="button" className="link-btn" onClick={reload}>Tentar novamente</button>
              </p>
            )}
            {alunos && alunos.length === 0 && <p className="card__empty">Nenhum aluno cadastrado ainda.</p>}
            {alunos && alunos.length > 0 && (
              <ul className="check-list">
                {alunos.map((a) => (
                  <li key={a._id}>
                    <CheckboxItem id={`aluno-${a._id}`} label={a.nome} checked={vinculos.has(a._id)} onChange={(m) => alternar(a._id, m)} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="form-actions">
          <Button type="submit" disabled={enviando}>{enviando ? 'Salvando…' : 'Salvar cuidador'}</Button>
          <Button variant="secondary" to="/cuidadores">Cancelar</Button>
        </div>
      </form>
    </>
  );
}
