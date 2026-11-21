// Teste de fumaça das regras de acesso. Roda contra um servidor JÁ em execução com banco real:
//   node scripts/smoke-test.mjs            (usa http://localhost:3000)
//   BASE_URL=http://localhost:8080 node scripts/smoke-test.mjs   (via proxy do front de teste)
// Cria dados com CNPJ/emails aleatórios no banco apontado pelo servidor. Use banco de teste.
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const rnd = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('');
const tag = rnd(6);
let falhas = 0;

async function http(metodo, caminho, { token, body } = {}) {
  const res = await fetch(BASE + caminho, {
    method: metodo,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const texto = await res.text();
  let data = {};
  try { data = texto ? JSON.parse(texto) : {}; } catch { /* corpo não-JSON */ }
  return { status: res.status, data, texto };
}

function confere(descricao, condicao, detalhe = '') {
  console.log(`${condicao ? 'PASS' : 'FAIL'}  ${descricao}${condicao ? '' : '  ' + detalhe}`);
  if (!condicao) falhas++;
}

const escolaBody = (sufixo) => ({
  cnpj: rnd(14), razaoSocial: `Escola Smoke ${sufixo}`,
  endereco: { numero: 1, rua: 'Rua A', municipio: 'Fortaleza', estado: 'CE' },
  telefone1: '85999990000', email: `escola${sufixo}@smoke.test`, senha: 'senha1234',
});

async function criarEscola(sufixo) {
  const body = escolaBody(sufixo);
  const cad = await http('POST', '/escolas/cadastro', { body });
  const login = await http('POST', '/escolas', { body: { cnpj: body.cnpj, senha: body.senha } });
  return { body, cad, token: login.data.token, login };
}

const A = await criarEscola(`${tag}a`);
const B = await criarEscola(`${tag}b`);
confere('cadastro das escolas A e B (201)', A.cad.status === 201 && B.cad.status === 201, `${A.cad.status}/${B.cad.status} ${A.cad.texto}`);
confere('resposta do cadastro não contém senha', !/senha/i.test(A.cad.texto));
confere('login das escolas devolve token', !!A.token && !!B.token);

const bad1 = await http('POST', '/escolas', { body: { cnpj: A.body.cnpj, senha: 'errada123' } });
const bad2 = await http('POST', '/escolas', { body: { cnpj: rnd(14), senha: 'errada123' } });
confere('senha errada e CNPJ inexistente dão a mesma resposta (401)',
  bad1.status === 401 && bad2.status === 401 && bad1.data.message === bad2.data.message);

const emailC1 = `c1${tag}@smoke.test`;
const c1 = await http('POST', '/cuidadores', { token: A.token, body: { nome: 'Cuidador 1', telefone: '85988880001', email: emailC1, senha: 'senha1234' } });
const c2 = await http('POST', '/cuidadores', { token: A.token, body: { nome: 'Cuidador 2', telefone: '85988880002', email: `c2${tag}@smoke.test`, senha: 'senha1234' } });
const cB = await http('POST', '/cuidadores', { token: B.token, body: { nome: 'Cuidador B', telefone: '85988880003', email: `cb${tag}@smoke.test`, senha: 'senha1234' } });
confere('escola cria cuidadores (201)', [c1, c2, cB].every((c) => c.status === 201), `${c1.status} ${c1.texto}`);
confere('resposta do cuidador não contém senha', !/senha/i.test(c1.texto));
const id1 = c1.data.cuidador?._id, id2 = c2.data.cuidador?._id, idB = cB.data.cuidador?._id;

const dup = await http('POST', '/cuidadores', { token: A.token, body: { nome: 'Dup', telefone: '85988880009', email: emailC1, senha: 'senha1234' } });
confere('email de cuidador duplicado (409)', dup.status === 409, String(dup.status));

const emailA1 = `a1${tag}@aluno.smoke.test`;
const cruzado = await http('POST', '/alunos', { token: A.token, body: { nome: 'Aluno X', email: `x${tag}@aluno.smoke.test`, senha: 'senha1234', cuidador: idB } });
confere('escola A não vincula aluno a cuidador da escola B (400)', cruzado.status === 400, `${cruzado.status} ${cruzado.texto}`);

const a1 = await http('POST', '/alunos', { token: A.token, body: { nome: 'Aluno 1', email: emailA1, senha: 'senha1234', dataNascimento: '2016-05-10', cuidador: id1 } });
const a2 = await http('POST', '/alunos', { token: A.token, body: { nome: 'Aluno 2', email: `a2${tag}@aluno.smoke.test`, senha: 'senha1234', cuidador: id2 } });
confere('escola cria alunos (201)', a1.status === 201 && a2.status === 201, `${a1.status} ${a1.texto}`);
const idA1 = a1.data.aluno?._id, idA2 = a2.data.aluno?._id;

const futuro = await http('POST', '/alunos', { token: A.token, body: { nome: 'Futuro', email: `f${tag}@aluno.smoke.test`, senha: 'senha1234', dataNascimento: '2999-01-01', cuidador: id1 } });
confere('data de nascimento futura é rejeitada (400)', futuro.status === 400);

const listaA = await http('GET', '/alunos', { token: A.token });
confere('escola A lista os 2 alunos dela', listaA.data.alunos?.length === 2, listaA.texto);

// Isolamento entre escolas
const listaB = await http('GET', '/alunos', { token: B.token });
confere('escola B não vê alunos da A', listaB.data.alunos?.length === 0, listaB.texto);
confere('escola B não lê aluno da A (404)', (await http('GET', `/alunos/${idA1}`, { token: B.token })).status === 404);
confere('escola B não altera aluno da A (404)', (await http('PATCH', `/alunos/${idA1}`, { token: B.token, body: { nome: 'Hack' } })).status === 404);
confere('escola B não exclui aluno da A (404)', (await http('DELETE', `/alunos/${idA1}`, { token: B.token })).status === 404);
confere('escola B não exclui cuidador da A (404)', (await http('DELETE', `/cuidadores/${id1}`, { token: B.token })).status === 404);
const cuidB = await http('GET', '/cuidadores', { token: B.token });
confere('escola B só lista o próprio cuidador', cuidB.data.cuidadores?.length === 1 && cuidB.data.cuidadores[0]._id === idB);

// Perfil do cuidador
const loginC1 = await http('POST', '/cuidadores/login', { body: { email: emailC1, senha: 'senha1234' } });
const tC1 = loginC1.data.token;
confere('cuidador faz login', !!tC1, loginC1.texto);
const listaC1 = await http('GET', '/alunos', { token: tC1 });
confere('cuidador vê só o aluno vinculado a ele', listaC1.data.alunos?.length === 1 && listaC1.data.alunos[0]._id === idA1, listaC1.texto);
confere('cuidador não lê aluno de outro cuidador (404)', (await http('GET', `/alunos/${idA2}`, { token: tC1 })).status === 404);
confere('cuidador não cria aluno (403)', (await http('POST', '/alunos', { token: tC1, body: { nome: 'N', email: `n${tag}@aluno.smoke.test`, senha: 'senha1234', cuidador: id1 } })).status === 403);
confere('cuidador não altera aluno (403)', (await http('PATCH', `/alunos/${idA1}`, { token: tC1, body: { nome: 'Hack' } })).status === 403);
confere('cuidador não exclui aluno (403)', (await http('DELETE', `/alunos/${idA1}`, { token: tC1 })).status === 403);
confere('cuidador não lista cuidadores (403)', (await http('GET', '/cuidadores', { token: tC1 })).status === 403);
const eu = await http('GET', '/cuidadores/eu', { token: tC1 });
confere('cuidador vê os próprios dados, sem senha', eu.status === 200 && !/senha/i.test(eu.texto), eu.texto);
confere('escola não acessa /cuidadores/eu (403)', (await http('GET', '/cuidadores/eu', { token: A.token })).status === 403);

// Login e acesso do aluno
const semSenha = await http('POST', '/alunos', { token: A.token, body: { nome: 'Sem Acesso', cuidador: id1 } });
confere('aluno sem email e senha é rejeitado (400)', semSenha.status === 400, String(semSenha.status));
confere('resposta de aluno não expõe a senha', !/senha/i.test(a1.texto), a1.texto);
const dupAluno = await http('POST', '/alunos', { token: A.token, body: { nome: 'Dup', email: emailA1, senha: 'senha1234', cuidador: id1 } });
confere('email de aluno duplicado (409)', dupAluno.status === 409, String(dupAluno.status));
confere('login do aluno com senha errada (401)', (await http('POST', '/alunos/login', { body: { email: emailA1, senha: 'errada123' } })).status === 401);
confere('login do aluno com email inexistente (401)', (await http('POST', '/alunos/login', { body: { email: `nao${tag}@aluno.smoke.test`, senha: 'senha1234' } })).status === 401);
const loginA1 = await http('POST', '/alunos/login', { body: { email: emailA1, senha: 'senha1234' } });
const tAl = loginA1.data.token;
confere('aluno faz login (200 + token)', loginA1.status === 200 && Boolean(tAl), loginA1.texto);
const euAl = await http('GET', '/alunos/eu', { token: tAl });
confere('aluno vê os próprios dados, sem senha nem cuidador', euAl.status === 200 && euAl.data.aluno?._id === idA1 && !/senha|cuidador|escola/i.test(euAl.texto), euAl.texto);
confere('aluno não lista alunos (403)', (await http('GET', '/alunos', { token: tAl })).status === 403);
confere('aluno não lê ficha de aluno (403)', (await http('GET', `/alunos/${idA1}`, { token: tAl })).status === 403);
confere('aluno não altera nem exclui (403)', (await http('PATCH', `/alunos/${idA1}`, { token: tAl, body: { nome: 'Hack' } })).status === 403 && (await http('DELETE', `/alunos/${idA1}`, { token: tAl })).status === 403);
confere('aluno não acessa cuidadores nem escola (403)', (await http('GET', '/cuidadores', { token: tAl })).status === 403 && (await http('GET', '/escolas/eu', { token: tAl })).status === 403);
confere('cuidador e escola não acessam /alunos/eu (403)', (await http('GET', '/alunos/eu', { token: tC1 })).status === 403 && (await http('GET', '/alunos/eu', { token: A.token })).status === 403);
const novoEmail = `a1novo${tag}@aluno.smoke.test`;
confere('escola troca email e senha do aluno (200)', (await http('PATCH', `/alunos/${idA1}`, { token: A.token, body: { email: novoEmail, senha: 'novasenha123' } })).status === 200);
confere('email antigo do aluno deixa de logar (401)', (await http('POST', '/alunos/login', { body: { email: emailA1, senha: 'senha1234' } })).status === 401);
confere('novo email e senha do aluno logam (200)', (await http('POST', '/alunos/login', { body: { email: novoEmail, senha: 'novasenha123' } })).status === 200);
confere('email antigo do aluno fica livre para novo cadastro', (await http('PATCH', `/alunos/${idA2}`, { token: A.token, body: { email: emailA1 } })).status === 200);
confere('email de aluno em uso por outro não pode ser reutilizado (409)', (await http('PATCH', `/alunos/${idA2}`, { token: A.token, body: { email: novoEmail } })).status === 409);
confere('escola B não vê o aluno da A pelo login da A (token de aluno só enxerga ele)', (await http('GET', '/alunos/eu', { token: tAl })).data.aluno?._id === idA1);
await http('PATCH', `/alunos/${idA1}`, { token: A.token, body: { ativo: false } });
confere('aluno inativo perde o acesso na hora (401)', (await http('GET', '/alunos/eu', { token: tAl })).status === 401);
confere('aluno inativo não faz login (403)', (await http('POST', '/alunos/login', { body: { email: novoEmail, senha: 'novasenha123' } })).status === 403);
await http('PATCH', `/alunos/${idA1}`, { token: A.token, body: { ativo: true } });

// Regras de vínculo e exclusão
confere('não exclui cuidador com aluno vinculado (409)', (await http('DELETE', `/cuidadores/${id1}`, { token: A.token })).status === 409);
const reatribui = await http('PATCH', `/alunos/${idA1}`, { token: A.token, body: { cuidador: id2 } });
confere('escola reatribui aluno para outro cuidador (200)', reatribui.status === 200, reatribui.texto);
confere('exclui cuidador sem alunos (200)', (await http('DELETE', `/cuidadores/${id1}`, { token: A.token })).status === 200);
confere('token de cuidador excluído deixa de valer (401)', (await http('GET', '/alunos', { token: tC1 })).status === 401);
confere('escola exclui aluno (200)', (await http('DELETE', `/alunos/${idA2}`, { token: A.token })).status === 200);

console.log(falhas ? `\n${falhas} verificação(ões) falharam` : '\nTudo certo');
process.exit(falhas ? 1 : 0);
