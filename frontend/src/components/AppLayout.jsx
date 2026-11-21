import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

// Estrutura das telas logadas: barra lateral + conteúdo (<Outlet /> recebe a página da rota)
export default function AppLayout() {
  return (
    <div className="app">
      <a href="#conteudo" className="skip-link">
        Ir para o conteúdo
      </a>
      <Sidebar />
      <main id="conteudo" className="app__main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
