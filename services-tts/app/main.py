"""Serviço TTS do ConecTEA.

Recebe um texto e o nome de uma voz, e devolve um arquivo de áudio WAV
gerado localmente pelo Piper. Não guarda nada em disco: o áudio é gerado
em memória e enviado na resposta.
"""
import io
import os
import threading
import wave
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from piper import PiperVoice

VOICES_DIR = Path(os.getenv("TTS_VOICES_DIR", Path(__file__).resolve().parent.parent / "voices"))
MAX_CHARS = int(os.getenv("TTS_MAX_CHARS", "500"))
API_KEY = os.getenv("TTS_API_KEY")  # opcional
# Opcional: pasta do espeak-ng-data. Útil no Windows quando o caminho do
# .venv tem caracteres não-ASCII (ex.: C:\\Users\\Álvaro), que o espeak não abre.
ESPEAK_DATA_DIR = os.getenv("TTS_ESPEAK_DATA_DIR")

# nome completo ("pt_BR-cadu-medium") -> caminho do .onnx
_available: dict[str, Path] = {}
# nome completo -> (PiperVoice, lock)
_loaded: dict[str, tuple[PiperVoice, threading.Lock]] = {}
_load_lock = threading.Lock()


def _scan_voices() -> None:
    """Descobre as vozes na pasta: cada .onnx precisa do seu .onnx.json ao lado."""
    _available.clear()
    for onnx in sorted(VOICES_DIR.glob("*.onnx")):
        if onnx.with_name(onnx.name + ".json").exists():
            _available[onnx.stem] = onnx


def _resolve(name: str) -> str:
    """Aceita o nome completo ('pt_BR-cadu-medium') ou o curto ('cadu')."""
    name = name.strip()
    if name in _available:
        return name
    matches = [full for full in _available if full.split("-")[1:2] == [name]]
    if len(matches) == 1:
        return matches[0]
    raise HTTPException(
        status_code=400,
        detail={"error": "voz_invalida", "voz": name, "vozes_disponiveis": list(_available)},
    )


def _get_voice(full_name: str) -> tuple[PiperVoice, threading.Lock]:
    with _load_lock:
        if full_name not in _loaded:
            kwargs = {"espeak_data_dir": ESPEAK_DATA_DIR} if ESPEAK_DATA_DIR else {}
            _loaded[full_name] = (
                PiperVoice.load(_available[full_name], **kwargs),
                threading.Lock(),
            )
        return _loaded[full_name]


@asynccontextmanager
async def lifespan(_: FastAPI):
    _scan_voices()
    if not _available:
        raise RuntimeError(f"Nenhuma voz encontrada em {VOICES_DIR}")
    for name in _available:  # pré-carrega: a 1ª requisição não fica lenta
        _get_voice(name)
    yield


app = FastAPI(title="ConecTEA TTS", version="1.0.0", lifespan=lifespan)


def check_api_key(x_api_key: str | None = Header(default=None)) -> None:
    if API_KEY and x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail={"error": "nao_autorizado"})


class SynthesizeRequest(BaseModel):
    text: str = Field(..., description="Frase a ser convertida em áudio")
    voice: str = Field(..., description="Nome da voz, ex.: 'cadu' ou 'pt_BR-cadu-medium'")


@app.get("/health")
def health():
    return {"status": "ok", "vozes": len(_available)}


@app.get("/voices")
def voices():
    return {"vozes": list(_available)}


@app.post("/synthesize", dependencies=[Depends(check_api_key)])
def synthesize(body: SynthesizeRequest):
    text = " ".join(body.text.split())  # normaliza espaços e quebras de linha
    if not text:
        raise HTTPException(status_code=400, detail={"error": "texto_vazio"})
    if len(text) > MAX_CHARS:
        raise HTTPException(
            status_code=400, detail={"error": "texto_muito_longo", "maximo": MAX_CHARS}
        )

    full_name = _resolve(body.voice)
    voice, lock = _get_voice(full_name)

    buffer = io.BytesIO()
    with lock, wave.open(buffer, "wb") as wav_file:
        voice.synthesize_wav(text, wav_file)

    return Response(
        content=buffer.getvalue(),
        media_type="audio/wav",
        headers={"X-Voice": full_name},
    )