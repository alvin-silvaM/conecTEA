import { useEffect, useMemo, useState } from 'react';
import { CircleCheck, Check, Loader2, Plus, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import EmocaoIcone from '../../components/aluno/EmocaoIcone.jsx';
import useFalaTts from '../../hooks/useFalaTts.js';
import { CARTOES_PADRAO, EMOCOES, lerCartoesCriados, pictogramaPorId } from '../../utils/cartoes.js';

// Tela principal do aluno: escolhe como se sente e toca nos cartões para a voz falar.
export default function ComunicacaoPage() {
  const { aluno } = useAuth();
  const alunoId = aluno?._id;
  const location = useLocation();
  const navigate = useNavigate();
  const [aviso, setAviso] = useState(location.state?.salvo ?? null);
  const [emocao, setEmocao] = useState(null);
  const [cartaoMarcado, setCartaoMarcado] = useState(null);
  const { falar, preparar, carregando, tocando, erro, limparErro } = useFalaTts(alunoId);

  const cartoes = useMemo(() => (alunoId ? [...CARTOES_PADRAO, ...lerCartoesCriados(alunoId)] : []), [alunoId]);

  // O aviso "Cartão salvo!" vem do state da navegação; limpa para não voltar ao recarregar a página
  useEffect(() => {
    if (location.state?.salvo) navigate('.', { replace: true, state: null });
  }, [location.state, navigate]);

  // Baixa as vozes dos cartões em segundo plano: quando o aluno toca, o som já está pronto
  useEffect(() => {
    if (cartoes.length) preparar(cartoes.map((c) => c.fala));
  }, [cartoes, preparar]);

  if (!alunoId) return <p className="aluno__carregando">Carregando…</p>;

  // Selecionar uma emoção apenas atualiza o estado visual; não reproduz áudio.
  const tocarEmocao = (e) => {
    setEmocao(e.id);
  };
  const tocarCartao = (c) => {
    setCartaoMarcado(c.id);
    falar(c.fala);
  };

  return (
    <>
      {aviso && (
        <div className="aviso-ok" role="status">
          <CircleCheck size={38} aria-hidden="true" />
          <div>
            <p className="aviso-ok__titulo">Cartão salvo!</p>
            <p>{aviso} já está nos seus cartões.</p>
          </div>
          <button type="button" className="aviso-ok__fechar" onClick={() => setAviso(null)} aria-label="Fechar aviso">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}
      {erro && (
        <div className="aviso-erro" role="alert">
          <p>{erro}</p>
          <button type="button" onClick={limparErro} aria-label="Fechar aviso">
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}

      <section className="painel" aria-labelledby="titulo-emocoes">
        <h2 id="titulo-emocoes">Como você está?</h2>
        <div className="emocoes">
          {EMOCOES.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`emocao ${emocao === e.id ? 'is-ativo' : ''}`}
              aria-pressed={emocao === e.id}
              onClick={() => tocarEmocao(e)}
            >
              <EmocaoIcone tipo={e.id} />
              <span>{e.rotulo}</span>
              {emocao === e.id && <Check className="marca" size={22} strokeWidth={3.2} aria-hidden="true" />}
            </button>
          ))}
        </div>
      </section>

      <h2 className="secao-titulo">Quero falar</h2>
      <div className="cartoes">
        {cartoes.map((c) => {
          const picto = pictogramaPorId(c.pictograma);
          const ativo = cartaoMarcado === c.id;
          return (
            <button
              key={c.id}
              type="button"
              className={`cartao cartao--${c.cor} ${ativo ? 'is-ativo' : ''} ${tocando === c.fala ? 'is-tocando' : ''}`}
              aria-pressed={ativo}
              onClick={() => tocarCartao(c)}
            >
              {picto && <img src={picto.src} alt="" />}
              <span className="cartao__texto">{c.rotulo}</span>
              {carregando === c.fala && <Loader2 className="cartao__carregando" size={22} aria-label="Preparando a voz" />}
              {ativo && carregando !== c.fala && <Check className="marca" size={22} strokeWidth={3.2} aria-hidden="true" />}
            </button>
          );
        })}
        <Link to="/cartao/novo" className="cartao cartao--novo">
          <span className="cartao__mais">
            <Plus size={64} strokeWidth={2.2} aria-hidden="true" />
          </span>
          <span className="cartao__texto">Novo cartão</span>
        </Link>
      </div>
    </>
  );
}
