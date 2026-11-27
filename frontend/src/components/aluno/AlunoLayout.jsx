import { Calendar, MessageCircle, User } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import icone from '../../assets/icone.svg';
import { useAuth } from '../../auth/AuthContext.jsx';
import Nuvens from './Nuvens.jsx';

// Moldura do app do aluno: cabeçalho "Oi, <nome>!", conteúdo e barra de navegação fixa embaixo.
export default function AlunoLayout() {
  const { aluno } = useAuth();
  const primeiroNome = aluno?.nome?.trim().split(/\s+/)[0];

  return (
    <div className="aluno">
      <div className="aluno__tela">
        <Nuvens />
        <header className="aluno__topo">
          <Link to="/" className="aluno__marca" aria-label="ConecTEA — ir para Comunicação">
            <img src={icone} alt="" />
          </Link>
          <p className="aluno__saudacao">{primeiroNome ? `Oi, ${primeiroNome}!` : 'Oi!'}</p>
          <Link to="/meus-dados" className="aluno__perfil" aria-label="Meus dados">
            <User size={26} strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </header>

        <main className="aluno__conteudo">
          <Outlet />
        </main>

        <nav className="aluno__nav" aria-label="Menu do aluno">
          <NavLink to="/" end className="aluno__nav-item">
            <MessageCircle size={26} strokeWidth={2.2} aria-hidden="true" />
            <span>Comunicação</span>
          </NavLink>
          <NavLink to="/rotina" className="aluno__nav-item">
            <Calendar size={26} strokeWidth={2.2} aria-hidden="true" />
            <span>Rotina</span>
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
