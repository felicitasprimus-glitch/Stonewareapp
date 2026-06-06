# ---------------------------------------------------------------------------
# Old Money Outfit Stylist – ein einziger Container (Frontend + Backend).
# Geeignet für kostenloses Hosting auf Render, Railway, Fly.io u.a.
# ---------------------------------------------------------------------------

# Stufe 1: Frontend bauen
FROM node:20-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stufe 2: Python-Backend + gebautes Frontend
FROM python:3.12-slim
WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ backend/
COPY --from=frontend /app/frontend/dist frontend/dist

WORKDIR /app/backend
ENV PORT=8000
# Hosting-Plattformen geben den Port per $PORT vor.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
