import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Building2 } from 'lucide-react';
import Logo from '../components/Logo.jsx';
import TextField from '../components/TextField.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import hero from '../assets/login-hero.webp';
import { useAuth } from '../auth/AuthContext.jsx';
import { apenasDigitos, mascararCnpj } from '../utils/format.js';

export default function LoginPage() {
  const { autenticado, entrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [cnpj, setCnpj] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (autenticado) return <Navigate to="/" replace />;

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (apenasDigitos(cnpj).length !== 14 || !senha) {
      setErro('Informe o CNPJ com 14 dígitos e a senha.');
      return;
    }
    setEnviando(true);
    try {
      await entrar(apenasDigitos(cnpj), senha);
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
          <p className="auth__desc">Acesso para a escola. Use o CNPJ e a senha do cadastro.</p>

          {location.state?.aviso && (
            <Alert tipo="sucesso" titulo={location.state.aviso} />
          )}
          {erro && <Alert titulo="Não foi possível entrar">{erro}</Alert>}

          <form onSubmit={enviar} noValidate>
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
          <p className="auth__alt">
            <Link to="/cadastro">Criar conta</Link>
          </p>
        </div>
      </section>
      <div className="auth__hero" style={{ backgroundImage: `url(${hero})` }} role="img" aria-label="Cuidadora e criança montando um quebra-cabeça" />
    </div>
  );
}
