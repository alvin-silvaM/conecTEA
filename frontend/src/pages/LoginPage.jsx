import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Building2, Mail } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import TextField from '../components/TextField.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import hero from '../assets/login-hero.webp';
import { useAuth } from '../auth/AuthContext.jsx';
import { apenasDigitos, emailValido, mascararCnpj } from '../utils/format.js';

export default function LoginPage() {
  const { autenticado, entrar, entrarCuidador } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [perfil, setPerfil] = useState('escola'); // "escola" entra com CNPJ; "cuidador" com e-mail
  const [cnpj, setCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (autenticado) return <Navigate to="/" replace />;

  const ehCuidador = perfil === 'cuidador';

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (ehCuidador ? !emailValido(email) || !senha : apenasDigitos(cnpj).length !== 14 || !senha) {
      setErro(ehCuidador ? 'Informe um e-mail válido e a senha.' : 'Informe o CNPJ com 14 dígitos e a senha.');
      return;
    }
    setEnviando(true);
    try {
      if (ehCuidador) await entrarCuidador(email.trim(), senha);
      else await entrar(apenasDigitos(cnpj), senha);
      navigate('/', { replace: true });
    } catch (err) {
      setErro(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth__panel">
        <div className="auth__content">
          <Logo height={48} />
          <h1>Entrar no ConecTEA</h1>
          <p className="auth__desc">
            {ehCuidador
              ? 'Acesso para o cuidador. Use o e-mail e a senha cadastrados pela escola.'
              : 'Acesso para a escola. Use o CNPJ e a senha do cadastro.'}
          </p>

          <div className="perfil-switch" role="group" aria-label="Entrar como">
            {[
              ['escola', 'Escola'],
              ['cuidador', 'Cuidador'],
            ].map(([valor, rotulo]) => (
              <button
                key={valor}
                type="button"
                className={`perfil-switch__btn ${perfil === valor ? 'is-active' : ''}`}
                aria-pressed={perfil === valor}
                onClick={() => {
                  setPerfil(valor);
                  setErro('');
                }}
              >
                {rotulo}
              </button>
            ))}
          </div>

          {location.state?.aviso && (
            <Alert tipo="sucesso" titulo={location.state.aviso} />
          )}
          {erro && <Alert titulo="Não foi possível entrar">{erro}</Alert>}

          <form onSubmit={enviar} noValidate>
            {ehCuidador ? (
              <TextField
                id="email"
                label="E-mail"
                icon={Mail}
                type="email"
                autoComplete="username"
                placeholder="nome@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            ) : (
              <TextField
                id="cnpj"
                label="CNPJ"
                icon={Building2}
                inputMode="numeric"
                autoComplete="username"
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={(e) => setCnpj(mascararCnpj(e.target.value))}
              />
            )}
            <TextField
              id="senha"
              label="Senha"
              icon={Lock}
              type={mostrarSenha ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              end={
                <button
                  type="button"
                  className="input__clear"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {mostrarSenha ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </button>
              }
            />
            <Button type="submit" className="btn--block btn--lg" disabled={enviando}>
              {enviando ? 'Entrando…' : 'Entrar'} <ArrowRight size={20} aria-hidden="true" />
            </Button>
          </form>
          {!ehCuidador && (
            <p className="auth__alt">
              <Link to="/cadastro">Criar conta</Link>
            </p>
          )}
        </div>
      </section>
      <div className="auth__hero" style={{ backgroundImage: `url(${hero})` }} role="img" aria-label="Cuidadora e criança montando um quebra-cabeça" />
    </div>
  );
}
