import { useState } from 'react';
import { CircleAlert, Lock, Pencil } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import TextField from '../components/TextField.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ResumoErros from '../components/ResumoErros.jsx';
import StateMessage from '../components/StateMessage.jsx';
import Alert from '../components/Alert.jsx';
import Button from '../components/Button.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { useApiData } from '../hooks/useApiData.js';
import { atualizarMeusDados, buscarMeuCuidador } from '../services/api.js';
import { apenasDigitos, mascararTelefone } from '../utils/format.js';

const ROTULOS = { nome: 'Nome completo', telefone: 'Telefone' };
// Mesmas regras e mensagens do back-end (atualizarMeusDadosSchema), para avisar antes de enviar
const MSG_NOME = 'Informe nome e sobrenome.';
const MSG_TELEFONE = 'Telefone incompleto. Use DDD + número, ex.: (88) 99999-0000.';
const DESCRICAO = 'Consulte as informações do seu cadastro de cuidador.';

export default function MeusDadosPage() {
  const { data, loading, error, reload } = useApiData(buscarMeuCuidador);

  if (loading) {
    return (
      <>
        <PageHeader titulo="Meus dados" descricao={DESCRICAO} />
        <p role="status">Carregando seus dados…</p>
      </>
    );
  }
  if (error) {
    return (
      <>
        <PageHeader titulo="Meus dados" descricao={DESCRICAO} />
        <div className="card">
          <StateMessage icon={CircleAlert} tone="erro" title="Não foi possível carregar seus dados" action={<Button onClick={reload}>Tentar novamente</Button>}>
            {error.message}
          </StateMessage>
        </div>
      </>
    );
  }
  return <Conteudo inicial={data} />;
}

function Conteudo({ inicial }) {
  const { setCuidador } = useAuth();
  const [cuidador, setLocal] = useState(inicial);
  const [editando, setEditando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  if (editando) {
    return (
      <Formulario
        cuidador={cuidador}
        onCancelar={() => setEditando(false)}
        onSalvo={(novo) => {
          setLocal(novo);
          setCuidador(novo); // atualiza o nome na barra lateral
          setSucesso(true);
          setEditando(false);
        }}
      />
    );
  }

  return (
    <>
      <PageHeader
        titulo="Meus dados"
        descricao={DESCRICAO}
        acao={
          <Button
            onClick={() => {
              setSucesso(false);
              setEditando(true);
            }}
          >
            <Pencil size={18} aria-hidden="true" /> Editar dados
          </Button>
        }
      />
      {sucesso && <Alert tipo="sucesso" titulo="Dados atualizados com sucesso." onClose={() => setSucesso(false)} />}
      <section className="card form-card" aria-labelledby="titulo-dados">
        <h2 id="titulo-dados">Dados do cuidador</h2>
        <dl className="dados-lista">
          <div>
            <dt>Nome completo</dt>
            <dd>{cuidador.nome}</dd>
          </div>
          <div>
            <dt>E-mail</dt>
            <dd>{cuidador.email}</dd>
          </div>
          <div>
            <dt>Telefone</dt>
            <dd>{cuidador.telefone}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <StatusBadge ativo={cuidador.ativo} />
            </dd>
          </div>
        </dl>
      </section>
    </>
  );
}

function Formulario({ cuidador, onCancelar, onSalvo }) {
  const [f, setF] = useState({ nome: cuidador.nome ?? '', telefone: mascararTelefone(cuidador.telefone ?? '') });
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const [salvando, setSalvando] = useState(false);

  function validar() {
    const e = {};
    if (f.nome.trim().split(/\s+/).filter(Boolean).length < 2) e.nome = MSG_NOME;
    const digitos = apenasDigitos(f.telefone).length;
    if (digitos < 10 || digitos > 11) e.telefone = MSG_TELEFONE;
    return e;
  }

  async function salvar(ev) {
    ev.preventDefault();
    setErroGeral('');
    const e = validar();
    setErros(e);
    if (Object.keys(e).length) {
      setTentativa((n) => n + 1);
      return;
    }

    // Só o que mudou é enviado; sem mudança, apenas volta para a leitura
    const nome = f.nome.trim().replace(/\s+/g, ' ');
    const mudancas = {};
    if (nome !== cuidador.nome) mudancas.nome = nome;
    if (apenasDigitos(f.telefone) !== apenasDigitos(cuidador.telefone ?? '')) mudancas.telefone = f.telefone;
    if (Object.keys(mudancas).length === 0) {
      onCancelar();
      return;
    }

    setSalvando(true);
    try {
      onSalvo(await atualizarMeusDados(mudancas));
    } catch (err) {
      const doServidor = {};
      err.erros?.forEach(({ campo, mensagem }) => {
        if (campo in ROTULOS) doServidor[campo] = mensagem;
      });
      setErros(doServidor);
      if (Object.keys(doServidor).length === 0) setErroGeral(err.message);
      else setTentativa((n) => n + 1);
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} noValidate>
      <PageHeader
        titulo="Meus dados"
        descricao="Altere nome e telefone. E-mail e status são somente leitura."
        acao={
          <div className="page-header__acoes">
            <Button variant="secondary" onClick={onCancelar} disabled={salvando}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          </div>
        }
      />

      <ResumoErros erros={erros} rotulos={ROTULOS} tentativa={tentativa} entidade="as alterações">
        {erroGeral && (
          <Alert titulo="Não foi possível salvar seus dados">
            <p>{erroGeral}</p>
          </Alert>
        )}
      </ResumoErros>

      <section className="card form-card" aria-labelledby="titulo-editar">
        <h2 id="titulo-editar">Editar dados do cuidador</h2>
        <div className="dados-form">
          <TextField id="nome" label="Nome completo" value={f.nome} onChange={(e) => setF((s) => ({ ...s, nome: e.target.value }))} error={erros.nome} autoComplete="name" />
          <TextField
            id="email"
            label="E-mail"
            value={cuidador.email}
            readOnly
            className="field--leitura"
            hint="Somente leitura. Esse dado não pode ser alterado aqui."
            end={<Lock size={18} aria-hidden="true" className="input__lock" />}
          />
          <TextField
            id="telefone"
            label="Telefone"
            inputMode="tel"
            placeholder="(88) 99999-0000"
            value={f.telefone}
            onChange={(e) => setF((s) => ({ ...s, telefone: mascararTelefone(e.target.value) }))}
            error={erros.telefone}
            autoComplete="tel"
          />
          <TextField
            id="status"
            label="Status"
            value={cuidador.ativo ? 'Ativo' : 'Inativo'}
            readOnly
            className="field--leitura"
            hint="Somente leitura. Esse dado não pode ser alterado aqui."
            end={<Lock size={18} aria-hidden="true" className="input__lock" />}
          />
        </div>
      </section>
    </form>
  );
}
