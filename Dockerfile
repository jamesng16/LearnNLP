FROM python:3.12-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HOST=0.0.0.0 \
    PORT=8000

RUN pip install --no-cache-dir fastapi==0.115.6 uvicorn==0.34.0

COPY 01_Foundations_Preprocessing ./01_Foundations_Preprocessing
COPY datasets ./datasets
COPY web ./web

EXPOSE 8000

CMD ["python", "web/app.py"]
