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

echo "[build:docker] Limpando builds anteriores..."
rm -f "$PROJECT_DIR/release/"*.exe "$PROJECT_DIR/release/"*.yml "$PROJECT_DIR/release/"*.blockmap

docker run --rm \
  --shm-size=512m \
  -v "$PROJECT_DIR:/project" \
  -v "$CACHE_DIR/electron:/root/.cache/electron" \
  -v "$CACHE_DIR/electron-builder:/root/.cache/electron-builder" \
  -v "$CACHE_DIR/npm:/root/.npm" \
  -e WINEDEBUG=-all \
  -w /project \
  "$IMAGE" \
  /bin/bash -c "
    echo '[build:docker] Inicializando Wine...' && \
    wine wineboot --init 2>/dev/null || true && \
    echo '[build:docker] Instalando dependências...' && \
    npm install --ignore-scripts && \
    echo '[build:docker] Recompilando módulos nativos para Electron...' && \
    npx electron-builder install-app-deps && \
    echo '[build:docker] Executando build:win...' && \
    npm run build:win
  "

echo "[build:docker] Removendo artefatos intermediários..."
rm -rf "$PROJECT_DIR/release/win-unpacked"

echo ""
echo "[build:docker] Build concluído!"
echo "[build:docker] Instalador disponível em: $PROJECT_DIR/release/"
