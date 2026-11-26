# services-tts

Serviço de síntese de voz do ConecTEA (Piper TTS + FastAPI). O backend envia
um texto e o nome de uma voz; o serviço devolve um arquivo WAV.

## Rodar

```bash
cd services-tts
python -m venv .venv
source .venv/Scripts/activate      # Git Bash no Windows (Linux/macOS: .venv/bin/activate)
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8001
```

## Endpoints

| Método | Rota          | Descrição                                     |
| ------ | ------------- | --------------------------------------------- |
| GET    | `/health`     | Verifica se o serviço está no ar              |
| GET    | `/voices`     | Lista as vozes disponíveis                    |
| POST   | `/synthesize` | Body JSON `{ "text", "voice" }` → `audio/wav` |

`voice` aceita o nome curto (`cadu`, `faber`, `jeff`, `edresson`) ou o completo
(`pt_BR-cadu-medium`).

Erros: `400` (voz inválida, texto vazio ou maior que `TTS_MAX_CHARS`),
`422` (campo ausente), `401` (só se `TTS_API_KEY` estiver definida).

## Variáveis de ambiente (opcionais)

Veja `.env.example`: `TTS_VOICES_DIR`, `TTS_MAX_CHARS`, `TTS_API_KEY`.

## Vozes

Coloque em `voices/` cada `.onnx` junto do seu `.onnx.json`. Novas vozes são
detectadas ao reiniciar o serviço. Os `.onnx` estão no `.gitignore`.
