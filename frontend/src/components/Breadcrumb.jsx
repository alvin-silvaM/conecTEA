import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumb({ pai, atual }) {
  return (
    <nav className="breadcrumb" aria-label="Você está em">
      <Link to={pai.to}>{pai.label}</Link>
      <ChevronRight size={16} aria-hidden="true" />
      <span aria-current="page">{atual}</span>
    </nav>
  );
}
