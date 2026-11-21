import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';

// Executa uma função assíncrona ao montar e expõe { data, loading, error, reload }.
// Se a API responder 401 (token expirado), encerra a sessão.
export function useApiData(fetcher) {
  const { sair } = useAuth();
  const [estado, setEstado] = useState({ data: null, loading: true, error: null });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    setEstado((s) => ({ ...s, loading: true, error: null }));
    fetcher()
      .then((data) => ativo && setEstado({ data, loading: false, error: null }))
      .catch((error) => {
        if (!ativo) return;
        if (error.status === 401) sair();
        setEstado({ data: null, loading: false, error });
      });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tentativa]);

  const reload = useCallback(() => setTentativa((n) => n + 1), []);
  return { ...estado, reload };
}
