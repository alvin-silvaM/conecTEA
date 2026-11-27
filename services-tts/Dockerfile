# Serviço TTS do ConecTEA: FastAPI + Piper.
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TTS_VOICES_DIR=/app/voices \
    TTS_MAX_CHARS=500

WORKDIR /app

# Bibliotecas/dados nativos necessários à fonemização do Piper.
RUN apt-get update \
    && apt-get install -y --no-install-recommends libespeak-ng1 espeak-ng-data \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# Copia somente o código e os modelos necessários ao serviço.
COPY app ./app
COPY voices ./voices

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
