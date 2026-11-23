import { NavLink } from 'react-router-dom';
import { Building2, CircleUser, ClipboardList, House, User, Users } from 'lucide-react';
import Logo from './Logo.jsx';
import Button from './Button.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

const ITENS_ESCOLA = [
  { to: '/', label: 'Início', icon: House, end: true },
  { to: '/alunos', label: 'Alunos', icon: User },
  { to: '/cuidadores', label: 'Cuidadores', icon: Users },
  { to: '/minha-escola', label: 'Minha escola', icon: Building2 },
];

const ITENS_CUIDADOR = [
  { to: '/', label: 'Início', icon: House, end: true },
  { to: '/alunos', label: 'Aluno', icon: User },
  { to: '/registro', label: 'Registro', icon: ClipboardList },
  { to: '/meus-dados', label: 'Meus dados', icon: CircleUser },
];

export default function Sidebar() {
  const { tipo, escola, cuidador, sair } = useAuth();
  const ehCuidador = tipo === 'cuidador';
  const itens = ehCuidador ? ITENS_CUIDADOR : ITENS_ESCOLA;
  const nome = ehCuidador ? (cuidador?.nome ?? 'Cuidador') : (escola?.razaoSocial ?? 'Administrador da escola');
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <Logo height={32} />
      </div>
      <nav aria-label="Menu principal" className="sidebar__nav">
        {itens.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="nav-link">
            <Icon size={20} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__user">
        <p className="sidebar__name">{nome}</p>
        <p className="sidebar__role">{ehCuidador ? 'Cuidador' : 'Administrador'}</p>
        <Button variant="secondary" onClick={sair} className="btn--block">
          Sair
        </Button>
      </div>
    </aside>
  );
}
