import { NavLink } from 'react-router-dom';
import { Building2, House, User, Users } from 'lucide-react';
import Logo from './Logo.jsx';
import Button from './Button.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

const ITENS = [
  { to: '/', label: 'Início', icon: House, end: true },
  { to: '/alunos', label: 'Alunos', icon: User },
  { to: '/cuidadores', label: 'Cuidadores', icon: Users },
  { to: '/minha-escola', label: 'Minha escola', icon: Building2 },
];

export default function Sidebar() {
  const { escola, sair } = useAuth();
  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <Logo height={32} />
      </div>
      <nav aria-label="Menu principal" className="sidebar__nav">
        {ITENS.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="nav-link">
            <Icon size={20} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__user">
        <p className="sidebar__name">{escola?.razaoSocial ?? 'Administrador da escola'}</p>
        <p className="sidebar__role">Administrador</p>
        <Button variant="secondary" onClick={sair} className="btn--block">
          Sair
        </Button>
      </div>
    </aside>
  );
}
