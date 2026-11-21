import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { buscarMinhaEscola, clearToken, getToken, loginEscola, setToken } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [autenticado, setAutenticado] = useState(Boolean(getToken()));
  const [escola, setEscola] = useState(null);

  const sair = useCallback(() => {
    clearToken();
    setEscola(null);
    setAutenticado(false);
  }, []);

  // Com token salvo, carrega os dados da escola (nome na barra lateral, tela "Minha escola").
  // Se o token expirou (401), volta para o login.
  useEffect(() => {
    if (!autenticado) return;
    let ativo = true;
    buscarMinhaEscola()
      .then((e) => ativo && setEscola(e))
      .catch((erro) => {
        if (ativo && erro.status === 401) sair();
      });
    return () => {
      ativo = false;
    };
  }, [autenticado, sair]);

  const entrar = useCallback(async (cnpj, senha) => {
    const { token } = await loginEscola({ cnpj, senha });
    setToken(token);
    setAutenticado(true);
  }, []);

  const value = useMemo(
    () => ({ autenticado, escola, setEscola, entrar, sair }),
    [autenticado, escola, entrar, sair],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
