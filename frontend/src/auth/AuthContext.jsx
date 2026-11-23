import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  buscarMeuCuidador,
  buscarMinhaEscola,
  clearToken,
  getToken,
  loginCuidador,
  loginEscola,
  setToken,
} from '../services/api.js';

const AuthContext = createContext(null);

// O perfil ("escola" ou "cuidador") vem do próprio token, só para escolher as telas.
// Quem decide o que cada perfil pode fazer é o back-end, que confere o token em toda requisição.
function tipoDoToken(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64)).tipo === 'cuidador' ? 'cuidador' : 'escola';
  } catch {
    return 'escola';
  }
}

export function AuthProvider({ children }) {
  const [autenticado, setAutenticado] = useState(Boolean(getToken()));
  const [tipo, setTipo] = useState(() => (getToken() ? tipoDoToken(getToken()) : null));
  const [escola, setEscola] = useState(null);
  const [cuidador, setCuidador] = useState(null);

  const sair = useCallback(() => {
    clearToken();
    setEscola(null);
    setCuidador(null);
    setTipo(null);
    setAutenticado(false);
  }, []);

  // Com token salvo, carrega os dados de quem está logado (nome na barra lateral e telas de dados).
  // Se o token expirou (401), volta para o login.
  useEffect(() => {
    if (!autenticado) return;
    let ativo = true;
    const carregar =
      tipo === 'cuidador'
        ? buscarMeuCuidador().then((c) => ativo && setCuidador(c))
        : buscarMinhaEscola().then((e) => ativo && setEscola(e));
    carregar.catch((erro) => {
      if (ativo && erro.status === 401) sair();
    });
    return () => {
      ativo = false;
    };
  }, [autenticado, tipo, sair]);

  const entrar = useCallback(async (cnpj, senha) => {
    const { token } = await loginEscola({ cnpj, senha });
    setToken(token);
    setTipo('escola');
    setAutenticado(true);
  }, []);

  const entrarCuidador = useCallback(async (email, senha) => {
    const { token } = await loginCuidador({ email, senha });
    setToken(token);
    setTipo('cuidador');
    setAutenticado(true);
  }, []);

  const value = useMemo(
    () => ({ autenticado, tipo, escola, setEscola, cuidador, setCuidador, entrar, entrarCuidador, sair }),
    [autenticado, tipo, escola, cuidador, entrar, entrarCuidador, sair],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
