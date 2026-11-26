# Backend ConecTEA

Backend Node.js + Express do ConecTEA. O Firestore continua armazenando os dados
e metadados; os arquivos WAV gerados pelo serviço `services-tts` são armazenados
em um bucket privado do Backblaze B2 pela API S3.

## Requisitos

- Node.js 22 ou superior.
- Projeto Firebase com Firestore habilitado.
- Conta Backblaze B2 e bucket privado.
- Serviço Python TTS em execução (consulte o README de `services-tts`).

## Instalação

```bash
npm install
cp .env.example .env
```

Preencha as variáveis de ambiente. Nunca versione `.env` nem arquivos JSON de
contas de serviço.

## Configurar o Firestore

Defina `FIREBASE_PROJECT_ID` e `GOOGLE_APPLICATION_CREDENTIALS`. Prefira um caminho
absoluto para o JSON da conta de serviço do Firebase, guardado fora do repositório.
Também é possível usar Application Default Credentials em ambientes GCP. Não use
uma chave de conta de serviço compartilhada por e-mail, ZIP ou Git.

A conta de serviço precisa ter as permissões necessárias para acessar o Firestore.

## Configurar o Backblaze B2

1. No painel Backblaze, crie um bucket **privado**.
2. Abra **App Keys** e crie uma Application Key limitada a esse bucket.
3. Conceda somente as capacidades necessárias para ler e gravar arquivos (readFiles
   e writeFiles). Não use a Master Application Key.
4. Copie o Key ID e a Application Key uma única vez; a chave secreta não poderá ser
   consultada novamente depois.
5. No bucket, copie a região e o endpoint S3 correspondente.
6. Preencha no `.env`:

```env
B2_ENDPOINT=https://s3.<regiao>.backblazeb2.com
B2_REGION=<regiao>
B2_BUCKET=<nome-exato-do-bucket>
B2_KEY_ID=<application-key-id>
B2_APPLICATION_KEY=<application-key>
```

Use o endpoint e a região reais exibidos no painel. Não inclua `https://` em
`B2_REGION`; não inclua o nome do bucket no endpoint.

O backend assina as chamadas S3 com AWS Signature Version 4 usando apenas módulos
nativos do Node.js. Não é necessário instalar um SDK adicional. O bucket permanece
privado: não são geradas URLs públicas. A leitura passa pela API autenticada do
ConecTEA.

## Associar áudio a um aluno

- Quando um aluno autenticado solicita `POST /tts/audios`, o áudio é associado ao
  próprio aluno; não envie `alunoId`.
- Quando um cuidador autenticado solicita `POST /tts/audios`, envie `alunoId` no
  corpo. O backend verifica se o aluno está ativo, pertence à escola do cuidador
  e está vinculado a ele.
- O caminho do objeto é organizado por escola, aluno e voz.
- O documento da coleção `audios_tts` guarda o campo `aluno` e o caminho `caminho`.
- O ID do documento inclui escola, aluno, voz e texto normalizado. Assim, uma frase
  já gerada para o mesmo aluno e voz pode ser reutilizada.

Exemplo para cuidador:

```json
{
  "texto": "Olá! Seja bem-vindo.",
  "voz": "cadu",
  "alunoId": "ID_DO_ALUNO"
}
```

Exemplo para aluno:

```json
{
  "texto": "Olá! Seja bem-vindo.",
  "voz": "cadu"
}
```

## Executar

```bash
npm install
npm run dev
```

O serviço TTS deve estar disponível em `TTS_URL` (padrão `http://127.0.0.1:8001`).

## Rotas TTS

Todas exigem `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/tts/vozes` | Lista vozes disponíveis |
| POST | `/tts/audios` | Gera ou reutiliza áudio |
| GET | `/tts/audios/:id` | Consulta metadados do áudio |
| GET | `/tts/audios/:id/arquivo` | Transmite o WAV após validar o acesso |

## Observações operacionais

- A API não devolve URL pública do Backblaze. O áudio é transmitido pelo backend,
  que verifica o vínculo do token com o aluno antes de cada leitura.
- O Firestore guarda metadados e o caminho do objeto; o binário WAV fica no B2.
- Faça backup e configure alertas de uso no Backblaze.
- Se uma operação de gravação no Firestore falhar depois do upload, pode sobrar um
  objeto órfão no bucket; monitore e remova órfãos periodicamente.
