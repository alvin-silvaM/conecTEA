import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import AppLayout from './components/AppLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import CadastroPage from './pages/CadastroPage.jsx';
import InicioPage from './pages/InicioPage.jsx';
import AlunosPage from './pages/AlunosPage.jsx';
import AlunoFormPage from './pages/AlunoFormPage.jsx';
import AlunoEditPage from './pages/AlunoEditPage.jsx';
import CuidadoresPage from './pages/CuidadoresPage.jsx';
import CuidadorFormPage from './pages/CuidadorFormPage.jsx';
import CuidadorEditPage from './pages/CuidadorEditPage.jsx';
import MinhaEscolaPage from './pages/MinhaEscolaPage.jsx';

// Rotas logadas: sem token, redireciona para o login
function RotaProtegida({ children }) {
  const { autenticado } = useAuth();
  return autenticado ? children : <Navigate to="/entrar" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route
        element={
          <RotaProtegida>
            <AppLayout />
          </RotaProtegida>
        }
      >
        <Route index element={<InicioPage />} />
        <Route path="alunos" element={<AlunosPage />} />
        <Route path="alunos/novo" element={<AlunoFormPage />} />
        <Route path="alunos/:id/editar" element={<AlunoEditPage />} />
        <Route path="cuidadores" element={<CuidadoresPage />} />
        <Route path="cuidadores/novo" element={<CuidadorFormPage />} />
        <Route path="cuidadores/:id/editar" element={<CuidadorEditPage />} />
        <Route path="minha-escola" element={<MinhaEscolaPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
