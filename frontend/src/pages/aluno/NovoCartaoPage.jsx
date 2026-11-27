import { useState } from 'react';
import { CircleAlert, Loader2, Plus, Volume2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import SeletorPictograma from '../../components/aluno/SeletorPictograma.jsx';
import useFalaTts, { garantirAudio } from '../../hooks/useFalaTts.js';
import { MAX_FRASE, pictogramaPorId, salvarCartao } from '../../utils/cartoes.js';

// Criar cartão: o aluno escreve a frase, escolhe o pictograma e, ao salvar, o backend gera a voz da frase
// (POST /tts/audios). O cartão só é guardado depois que o áudio existe.
export default function NovoCartaoPage() {
  const { aluno } = useAuth();
  const navigate = useNavigate();
  const { falar, carregando, tocando, erro: erroOuvir } = useFalaTts(aluno?._id);
  const [texto, setTexto] = useState('');
  const [pictograma, setPictograma] = useState(null);
  const [folha, setFolha] = useState(false);
  const [tentou, setTentou] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroApi, setErroApi] = useState('');

  const frase = texto.trim();
  const erroTexto = tentou && !frase ? 'Escreva a frase para gerar o áudio.' : '';
  const erroPicto = tentou && !pictograma ? 'Escolha um pictograma para o cartão.' : '';
  const picto = pictogramaPorId(pictograma);

  async function salvar(e) {
    e.preventDefault();
    setTentou(true);
    setErroApi('');
    if (!frase || !pictograma || !aluno) return;

    setSalvando(true);
    try {
      const { audioId, texto: fraseFinal } = await garantirAudio(aluno._id, frase);
      salvarCartao(aluno._id, { texto: fraseFinal, pictograma, audioId });
      navigate('/', { replace: true, state: { salvo: fraseFinal } });
    } catch (err) {
      setErroApi(err.message || 'Não foi possível salvar o cartão. Tente de novo.');
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} noValidate>
      <h1 className="aluno__titulo">Criar cartão</h1>

      <div className="campo">
        <div className="campo__rotulo">
          <label htmlFor="frase">Frase do cartão</label>
          <span className="etiqueta etiqueta--obrigatorio">Obrigatório</span>
        </div>
        <input
          id="frase"
          className={`campo__input ${erroTexto ? 'is-erro' : ''}`}
          type="text"
          maxLength={MAX_FRASE}
          placeholder="Ex.: Quero beber água"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-invalid={erroTexto ? 'true' : undefined}
          aria-describedby="frase-ajuda"
          autoComplete="off"
        />
        {erroTexto ? (
          <p id="frase-ajuda" className="campo__erro">
            <CircleAlert size={18} aria-hidden="true" /> {erroTexto}
          </p>
        ) : (
          <p id="frase-ajuda" className="campo__ajuda">
            É o que a voz vai falar quando você tocar no cartão.
          </p>
        )}
      </div>

      <div className="campo">
        <div className="campo__rotulo">
          <span id="audio-rotulo">Mensagem de áudio</span>
          <span className="etiqueta etiqueta--auto">Automática</span>
        </div>
        <button
          type="button"
          className="campo__input campo__audio"
          aria-labelledby="audio-rotulo"
          disabled={!frase || carregando !== null}
          onClick={() => falar(frase)}
        >
          {carregando ? <Loader2 className="gira" size={22} aria-hidden="true" /> : <Volume2 size={22} aria-hidden="true" />}
          <span>
            {carregando
              ? 'Preparando a voz…'
              : tocando
                ? 'Tocando…'
                : frase
                  ? 'Toque para ouvir como vai ficar'
                  : 'A voz é criada a partir da frase'}
          </span>
        </button>
        {erroOuvir ? (
          <p className="campo__erro">
            <CircleAlert size={18} aria-hidden="true" /> {erroOuvir}
          </p>
        ) : (
          <p className="campo__ajuda">O áudio é gerado quando você salva o cartão.</p>
        )}
      </div>

      {picto ? (
        <button type="button" className="picto-escolhido" onClick={() => setFolha(true)}>
          <span className="picto-escolhido__img">
            <img src={picto.src} alt="" />
          </span>
          <span>
            <strong>{picto.nome}</strong>
            <small>Toque para trocar</small>
          </span>
        </button>
      ) : (
        <>
          <button
            type="button"
            className={`picto-vazio ${erroPicto ? 'is-erro' : ''}`}
            onClick={() => setFolha(true)}
            aria-describedby={erroPicto ? 'picto-erro' : undefined}
          >
            <span className="picto-vazio__mais">
              <Plus size={36} strokeWidth={2.6} aria-hidden="true" />
            </span>
            Escolher pictograma
          </button>
          {erroPicto && (
            <p id="picto-erro" className="campo__erro campo__erro--solto">
              {erroPicto}
            </p>
          )}
        </>
      )}

      {erroApi && (
        <p className="campo__erro campo__erro--solto" role="alert">
          <CircleAlert size={18} aria-hidden="true" /> {erroApi}
        </p>
      )}

      <div className="acoes">
        <button type="button" className="aluno-btn aluno-btn--claro" onClick={() => navigate('/')} disabled={salvando}>
          Cancelar
        </button>
        <button type="submit" className="aluno-btn aluno-btn--azul" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar cartão'}
        </button>
      </div>

      {folha && (
        <SeletorPictograma
          atual={pictograma}
          onCancelar={() => setFolha(false)}
          onEscolher={(id) => {
            setPictograma(id);
            setFolha(false);
          }}
        />
      )}
    </form>
  );
}
