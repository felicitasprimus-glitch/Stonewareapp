# Old Money Outfit Stylist – Hugging Face Space (Docker).
# Nutzt das offizielle Playwright-Image (Chromium bereits installiert),
# damit auch JavaScript-lastige Shops echt gerendert werden können.
FROM mcr.microsoft.com/playwright/python:v1.47.0-jammy

# Schreibbare Pfade für den HF-Benutzer (uid 1000)
ENV HOME=/tmp \
    STORE_DIR=/tmp/oms-data \
    STATIC_DIR=/app/static \
    PORT=7860 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY backend/ /app/
COPY static/ /app/static/

EXPOSE 7860
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
