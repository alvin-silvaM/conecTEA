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
import InicioCuidadorPage from './pages/InicioCuidadorPage.jsx';
import AlunosCuidadorPage from './pages/AlunosCuidadorPage.jsx';
import RegistroPage from './pages/RegistroPage.jsx';
import MeusDadosPage from './pages/MeusDadosPage.jsx';
import AlunoLayout from './components/aluno/AlunoLayout.jsx';
import ComunicacaoPage from './pages/aluno/ComunicacaoPage.jsx';
import NovoCartaoPage from './pages/aluno/NovoCartaoPage.jsx';
import RotinaAlunoPage from './pages/aluno/RotinaAlunoPage.jsx';
import MeusDadosAlunoPage from './pages/aluno/MeusDadosAlunoPage.jsx';

// Rotas logadas: sem token, redireciona para o login
function RotaProtegida({ children }) {
  const { autenticado } = useAuth();
  return autenticado ? children : <Navigate to="/entrar" replace />;
}

// Mesma rota, tela diferente conforme o perfil de quem está logado
function PorPerfil({ escola, cuidador }) {
  const { tipo } = useAuth();
  return tipo === 'cuidador' ? cuidador : escola;
}

// Telas exclusivas de um perfil: o outro perfil volta para o início
function ApenasPerfil({ perfil, children }) {
  const { tipo } = useAuth();
  return tipo === perfil ? children : <Navigate to="/" replace />;
}

// O aluno usa um app próprio (comunicador, layout de celular): rotas separadas das da escola/cuidador.
function RotasAluno() {
  return (
    <Routes>
      <Route element={<AlunoLayout />}>
        <Route index element={<ComunicacaoPage />} />
        <Route path="cartao/novo" element={<NovoCartaoPage />} />
        <Route path="rotina" element={<RotinaAlunoPage />} />
        <Route path="meus-dados" element={<MeusDadosAlunoPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const { autenticado, tipo } = useAuth();
  if (autenticado && tipo === 'aluno') return <RotasAluno />;
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
        <Route index element={<PorPerfil escola={<InicioPage />} cuidador={<InicioCuidadorPage />} />} />
        <Route path="alunos" element={<PorPerfil escola={<AlunosPage />} cuidador={<AlunosCuidadorPage />} />} />

        {/* Cuidador */}
        <Route path="registro" element={<ApenasPerfil perfil="cuidador"><RegistroPage /></ApenasPerfil>} />
        <Route path="meus-dados" element={<ApenasPerfil perfil="cuidador"><MeusDadosPage /></ApenasPerfil>} />

        {/* Escola */}
        <Route path="alunos/novo" element={<ApenasPerfil perfil="escola"><AlunoFormPage /></ApenasPerfil>} />
        <Route path="alunos/:id/editar" element={<ApenasPerfil perfil="escola"><AlunoEditPage /></ApenasPerfil>} />
        <Route path="cuidadores" element={<ApenasPerfil perfil="escola"><CuidadoresPage /></ApenasPerfil>} />
        <Route path="cuidadores/novo" element={<ApenasPerfil perfil="escola"><CuidadorFormPage /></ApenasPerfil>} />
        <Route path="cuidadores/:id/editar" element={<ApenasPerfil perfil="escola"><CuidadorEditPage /></ApenasPerfil>} />
        <Route path="minha-escola" element={<ApenasPerfil perfil="escola"><MinhaEscolaPage /></ApenasPerfil>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
