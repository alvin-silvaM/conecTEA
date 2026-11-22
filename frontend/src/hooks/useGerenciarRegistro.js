import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

// Aceita o aviso vindo de outra tela (state do react-router): texto simples ou { tipo, titulo, texto }.
function normalizar(aviso, tituloPadrao) {
  if (!aviso) return null;
  if (typeof aviso === 'string') return { tipo: 'sucesso', titulo: tituloPadrao, texto: aviso };
  return aviso;
}

// Lógica das ações de lista, igual para alunos e cuidadores:
// ativar/desativar, excluir (com confirmação) e o aviso de resultado.
export function useGerenciarRegistro({ tituloSalvo, atualizar, excluir, aoMudar }) {
  const { sair } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [aviso, setAviso] = useState(() => normalizar(location.state?.aviso, tituloSalvo));
  const [ocupadoId, setOcupadoId] = useState(null);
  const [alvo, setAlvo] = useState(null); // registro que está sendo confirmado para exclusão
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState('');

  const fecharAviso = () => {
    setAviso(null);
    navigate('.', { replace: true, state: null }); // evita o aviso reaparecer ao recarregar
  };

  async function alternarStatus(registro) {
    setOcupadoId(registro._id);
    setAviso(null);
    try {
      await atualizar(registro._id, { ativo: !registro.ativo });
      setAviso({
        tipo: 'sucesso',
        titulo: registro.ativo ? 'Cadastro desativado' : 'Cadastro ativado',
        texto: `${registro.nome} agora está ${registro.ativo ? 'inativo' : 'ativo'}.`,
      });
      aoMudar();
    } catch (erro) {
      if (erro.status === 401) sair();
      setAviso({ tipo: 'erro', titulo: 'Não foi possível alterar o status', texto: erro.message });
    } finally {
      setOcupadoId(null);
    }
  }

  const pedirExclusao = (registro) => {
    setErroExclusao('');
    setAlvo(registro);
  };
  const cancelarExclusao = () => setAlvo(null);

  async function confirmarExclusao() {
    setExcluindo(true);
    setErroExclusao('');
    try {
      await excluir(alvo._id);
      setAviso({ tipo: 'sucesso', titulo: 'Cadastro excluído', texto: `${alvo.nome} foi excluído.` });
      setAlvo(null);
      aoMudar();
    } catch (erro) {
      if (erro.status === 401) sair();
      setErroExclusao(erro.message); // ex.: 409 "Cuidador possui alunos vinculados..."
    } finally {
      setExcluindo(false);
    }
  }

  return { aviso, fecharAviso, ocupadoId, alternarStatus, alvo, pedirExclusao, cancelarExclusao, confirmarExclusao, excluindo, erroExclusao };
}
