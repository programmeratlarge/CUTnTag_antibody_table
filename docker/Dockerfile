FROM python:3.12-slim

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Copy dependency files first for layer caching
COPY pyproject.toml uv.lock* ./
RUN uv sync --no-dev --frozen

# Copy the rest of the project
COPY config.yaml ./
COPY src/ ./src/
COPY static/ ./static/

EXPOSE 7862

CMD ["uv", "run", "uvicorn", "cutntagtable.main:app", "--host", "0.0.0.0", "--port", "7862"]
