import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import TextField from '../components/TextField.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import hero from '../assets/login-hero.webp';
import { useAuth } from '../auth/AuthContext.jsx';
import { cadastrarEscola } from '../services/api.js';
import { apenasDigitos, emailValido, mascararCnpj, mascararTelefone } from '../utils/format.js';

const VAZIO = { cnpj: '', razaoSocial: '', rua: '', numero: '', municipio: '', estado: '', telefone1: '', email: '', senha: '' };
const CAMPO_API = { 'endereco.rua': 'rua', 'endereco.numero': 'numero', 'endereco.municipio': 'municipio', 'endereco.estado': 'estado' };

export default function CadastroPage() {
  const { autenticado } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (autenticado) return <Navigate to="/" replace />;

  const set = (campo) => (e) => setF((s) => ({ ...s, [campo]: e.target.value }));

  function validar() {
    const e = {};
    if (apenasDigitos(f.cnpj).length !== 14) e.cnpj = 'Informe um CNPJ com 14 dígitos.';
    if (!f.razaoSocial.trim()) e.razaoSocial = 'Informe a razão social.';
    if (!f.rua.trim()) e.rua = 'Informe a rua.';
    if (!(Number.isInteger(Number(f.numero)) && Number(f.numero) > 0)) e.numero = 'Informe o número.';
    if (!f.municipio.trim()) e.municipio = 'Informe o município.';
    if (!f.estado.trim()) e.estado = 'Informe o estado.';
    if (apenasDigitos(f.telefone1).length < 8) e.telefone1 = 'Informe um telefone com DDD.';
    if (!emailValido(f.email)) e.email = 'Informe um e-mail válido, como nome@exemplo.com.';
    if (f.senha.length < 8) e.senha = 'Use no mínimo 8 caracteres.';
    return e;
  }

  async function enviar(ev) {
    ev.preventDefault();
    setErroGeral('');
    const e = validar();
    setErros(e);
    if (Object.keys(e).length) return;

    setEnviando(true);
    try {
      await cadastrarEscola({
        cnpj: apenasDigitos(f.cnpj),
        razaoSocial: f.razaoSocial.trim(),
        endereco: { numero: Number(f.numero), rua: f.rua.trim(), municipio: f.municipio.trim(), estado: f.estado.trim() },
        telefone1: f.telefone1,
        email: f.email.trim(),
        senha: f.senha,
      });
      navigate('/entrar', { replace: true, state: { aviso: 'Escola cadastrada. Entre com o CNPJ e a senha.' } });
    } catch (err) {
      // Erros de validação do servidor viram mensagens junto de cada campo
      const doServidor = {};
      err.erros.forEach(({ campo, mensagem }) => {
        const nome = CAMPO_API[campo] ?? campo;
        if (nome in VAZIO) doServidor[nome] = mensagem;
      });
      setErros(doServidor);
      if (Object.keys(doServidor).length === 0) setErroGeral(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth__panel">
        <div className="auth__content auth__content--wide">
          <Logo height={48} />
          <h1>Cadastrar escola</h1>
          <p className="auth__desc">Preencha os dados da instituição para criar a conta.</p>
          {erroGeral && <Alert titulo="Não foi possível cadastrar">{erroGeral}</Alert>}
          <form onSubmit={enviar} noValidate className="form-grid">
            <TextField id="cnpj" label="CNPJ" inputMode="numeric" value={f.cnpj} onChange={(e) => setF((s) => ({ ...s, cnpj: mascararCnpj(e.target.value) }))} error={erros.cnpj} placeholder="00.000.000/0000-00" />
            <TextField id="razaoSocial" label="Razão social" value={f.razaoSocial} onChange={set('razaoSocial')} error={erros.razaoSocial} />
            <TextField id="rua" label="Rua" value={f.rua} onChange={set('rua')} error={erros.rua} />
            <TextField id="numero" label="Número" inputMode="numeric" value={f.numero} onChange={(e) => setF((s) => ({ ...s, numero: apenasDigitos(e.target.value) }))} error={erros.numero} />
            <TextField id="municipio" label="Município" value={f.municipio} onChange={set('municipio')} error={erros.municipio} />
            <TextField id="estado" label="Estado" value={f.estado} onChange={set('estado')} error={erros.estado} placeholder="CE" />
            <TextField id="telefone1" label="Telefone" inputMode="tel" value={f.telefone1} onChange={(e) => setF((s) => ({ ...s, telefone1: mascararTelefone(e.target.value) }))} error={erros.telefone1} hint="Inclua o DDD." />
            <TextField id="email" label="E-mail" type="email" autoComplete="email" value={f.email} onChange={set('email')} error={erros.email} />
            <TextField id="senha" label="Senha" type="password" autoComplete="new-password" value={f.senha} onChange={set('senha')} error={erros.senha} hint="Mínimo de 8 caracteres." className="form-grid__full" />
            <Button type="submit" className="btn--block btn--lg form-grid__full" disabled={enviando}>
              {enviando ? 'Cadastrando…' : 'Cadastrar escola'}
            </Button>
          </form>
          <p className="auth__alt">
            Já tem conta? <Link to="/entrar">Entrar</Link>
          </p>
        </div>
      </section>
      <div className="auth__hero" style={{ backgroundImage: `url(${hero})` }} role="img" aria-label="Cuidadora e criança montando um quebra-cabeça" />
    </div>
  );
}
