#!/bin/bash
set -euo pipefail

IMAGE="electronuserland/builder:wine"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CACHE_DIR="${HOME}/.cache/electron-builder-docker"

if ! command -v docker &> /dev/null; then
  echo "[build:docker] Erro: Docker não encontrado. Instale Docker primeiro."
  echo "[build:docker] Veja: https://docs.docker.com/engine/install/"
  exit 1
fi

mkdir -p "$CACHE_DIR"

echo "[build:docker] Iniciando build do instalador Windows..."
echo "[build:docker] Imagem: $IMAGE"
echo "[build:docker] Projeto: $PROJECT_DIR"
echo "[build:docker] Cache: $CACHE_DIR"
echo ""

docker run --rm \
  -v "$PROJECT_DIR:/project" \
  -v "$CACHE_DIR/electron:/root/.cache/electron" \
  -v "$CACHE_DIR/electron-builder:/root/.cache/electron-builder" \
  -v "$CACHE_DIR/npm:/root/.npm" \
  -w /project \
  "$IMAGE" \
  /bin/bash -c "
    echo '[build:docker] Instalando dependências...' && \
    npm install && \
    echo '[build:docker] Recompilando módulos nativos para Electron...' && \
    npx electron-builder install-app-deps && \
    echo '[build:docker] Executando build:win...' && \
    npm run build:win
  "

echo ""
echo "[build:docker] Build concluído!"
echo "[build:docker] Instalador disponível em: $PROJECT_DIR/release/"
