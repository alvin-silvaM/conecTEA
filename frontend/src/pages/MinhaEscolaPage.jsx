import { useEffect, useState } from 'react';
import { CircleAlert } from 'lucide-react';
import PageHeader from '../components/PageHeader.jsx';
import Button from '../components/Button.jsx';
import Alert from '../components/Alert.jsx';
import TextField from '../components/TextField.jsx';
import StateMessage from '../components/StateMessage.jsx';
import { useApiData } from '../hooks/useApiData.js';
import { useAuth } from '../auth/AuthContext.jsx';
import { atualizarMinhaEscola, buscarMinhaEscola } from '../services/api.js';
import { apenasDigitos, emailValido, enderecoEmTexto, mascararCnpj, mascararTelefone } from '../utils/format.js';

function Dado({ rotulo, valor }) {
  return (
    <div>
      <dt>{rotulo}</dt>
      <dd>{valor || '—'}</dd>
    </div>
  );
}

const paraFormulario = (e) => ({
  razaoSocial: e.razaoSocial,
  rua: e.endereco.rua,
  numero: String(e.endereco.numero),
  municipio: e.endereco.municipio,
  estado: e.endereco.estado,
  telefone1: e.telefone1,
  telefone2: e.telefone2 ?? '',
  email: e.email,
});

export default function MinhaEscolaPage() {
  const { setEscola } = useAuth();
  const { data: escola, loading, error, reload } = useApiData(buscarMinhaEscola);
  const [editando, setEditando] = useState(false);
  const [f, setF] = useState(null);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (escola) setF(paraFormulario(escola));
  }, [escola]);

  if (error) {
    return (
      <>
        <PageHeader titulo="Minha escola" descricao="Veja e atualize as informações da sua escola." />
        <div className="card">
          <StateMessage icon={CircleAlert} tone="erro" title="Não foi possível carregar os dados da escola" action={<Button onClick={reload}>Tentar novamente</Button>}>
            {error.message}
          </StateMessage>
        </div>
      </>
    );
  }
  if (loading || !escola || !f) {
    return (
      <>
        <PageHeader titulo="Minha escola" descricao="Veja e atualize as informações da sua escola." />
        <p role="status">Carregando…</p>
      </>
    );
  }

  const set = (campo) => (e) => setF((s) => ({ ...s, [campo]: e.target.value }));

  function cancelar() {
    setF(paraFormulario(escola));
    setErros({});
    setErroGeral('');
    setEditando(false);
  }

  async function salvar(ev) {
    ev.preventDefault();
    setErroGeral('');
    setSucesso(false);
    const e = {};
    if (!f.razaoSocial.trim()) e.razaoSocial = 'Informe o nome da escola.';
    if (!f.rua.trim()) e.rua = 'Informe a rua.';
    if (!(Number(f.numero) > 0 && Number.isInteger(Number(f.numero)))) e.numero = 'Informe o número.';
    if (!f.municipio.trim()) e.municipio = 'Informe o município.';
    if (!f.estado.trim()) e.estado = 'Informe o estado.';
    if (apenasDigitos(f.telefone1).length < 8) e.telefone1 = 'Informe um telefone com DDD.';
    if (f.telefone2 && apenasDigitos(f.telefone2).length < 8) e.telefone2 = 'Informe um telefone com DDD.';
    if (!emailValido(f.email)) e.email = 'Informe um e-mail válido.';
    setErros(e);
    if (Object.keys(e).length) return;

    const corpo = {
      razaoSocial: f.razaoSocial.trim(),
      endereco: { numero: Number(f.numero), rua: f.rua.trim(), municipio: f.municipio.trim(), estado: f.estado.trim() },
      telefone1: f.telefone1,
      email: f.email.trim(),
    };
    
    if (f.telefone2) corpo.telefone2 = f.telefone2;
    else if (escola.telefone2) corpo.telefone2 = null;

    setSalvando(true);
    try {
      const atualizada = await atualizarMinhaEscola(corpo);
      setEscola(atualizada);
      setEditando(false);
      setSucesso(true);
      reload();
    } catch (err) {
      const mapa = { 'endereco.rua': 'rua', 'endereco.numero': 'numero', 'endereco.municipio': 'municipio', 'endereco.estado': 'estado' };
      const doServidor = {};
      err.erros.forEach(({ campo, mensagem }) => {
        const nome = mapa[campo] ?? campo;
        if (nome in f) doServidor[nome] = mensagem;
      });
      if (err.status === 409) doServidor.email = err.message;
      setErros(doServidor);
      if (Object.keys(doServidor).length === 0) setErroGeral(err.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <PageHeader titulo="Minha escola" descricao="Veja e atualize as informações da sua escola." />
      {sucesso && (
        <Alert tipo="sucesso" titulo="Dados atualizados" onClose={() => setSucesso(false)}>
          <p>As informações da escola foram salvas.</p>
        </Alert>
      )}
      {erroGeral && <Alert titulo="Não foi possível salvar">{erroGeral}</Alert>}

      <section className="card school-card" aria-labelledby="titulo-dados">
        <div className="school-card__head">
          <div>
            <h2 id="titulo-dados">Dados da escola</h2>
            <p className="card__desc">Informações de identificação e contato da escola.</p>
          </div>
          {!editando && (
            <Button variant="secondary" onClick={() => { setSucesso(false); setEditando(true); }}>
              Editar dados
            </Button>
          )}
        </div>

        {editando ? (
          <form onSubmit={salvar} noValidate className="form-grid">
            <TextField id="razaoSocial" label="Nome da escola" value={f.razaoSocial} onChange={set('razaoSocial')} error={erros.razaoSocial} />
            <TextField id="email" label="E-mail de contato" type="email" value={f.email} onChange={set('email')} error={erros.email} />
            <TextField id="rua" label="Rua" value={f.rua} onChange={set('rua')} error={erros.rua} />
            <TextField id="numero" label="Número" inputMode="numeric" value={f.numero} onChange={(e) => setF((s) => ({ ...s, numero: apenasDigitos(e.target.value) }))} error={erros.numero} />
            <TextField id="municipio" label="Município" value={f.municipio} onChange={set('municipio')} error={erros.municipio} />
            <TextField id="estado" label="Estado" value={f.estado} onChange={set('estado')} error={erros.estado} />
            <TextField id="telefone1" label="Telefone" inputMode="tel" value={f.telefone1} onChange={(e) => setF((s) => ({ ...s, telefone1: mascararTelefone(e.target.value) }))} error={erros.telefone1} />
            <TextField id="telefone2" label="Telefone 2 (opcional)" inputMode="tel" value={f.telefone2} onChange={(e) => setF((s) => ({ ...s, telefone2: mascararTelefone(e.target.value) }))} error={erros.telefone2} />
            <div className="form-actions form-grid__full">
              <Button type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar alterações'}</Button>
              <Button variant="secondary" onClick={cancelar}>Cancelar</Button>
            </div>
          </form>
        ) : (
          <dl className="data-grid">
            <Dado rotulo="Nome da escola" valor={escola.razaoSocial} />
            <Dado rotulo="Endereço" valor={enderecoEmTexto(escola.endereco)} />
            <Dado rotulo="Telefone" valor={[escola.telefone1, escola.telefone2].filter(Boolean).join(' · ')} />
            <Dado rotulo="E-mail de contato" valor={escola.email} />
            <Dado rotulo="CNPJ" valor={mascararCnpj(escola.cnpj)} />
          </dl>
        )}
      </section>
    </>
  );
}
