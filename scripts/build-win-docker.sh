#!/bin/bash
set -euo pipefail

IMAGE="electronuserland/builder:wine"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CACHE_DIR="${HOME}/.cache/electron-builder-docker"
RELEASE_DIR="${PROJECT_DIR}/release"

cleanup() {
  echo "[build:docker] Limpando artefatos intermediários..."
  rm -rf "${RELEASE_DIR}/win-unpacked"
}

trap cleanup EXIT

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
rm -f "${RELEASE_DIR}/"*.exe "${RELEASE_DIR}/"*.yml "${RELEASE_DIR}/"*.blockmap

docker run --rm \
  --shm-size=1g \
  -v "$PROJECT_DIR:/project" \
  -v "$CACHE_DIR/electron-builder:/root/.cache/electron-builder" \
  -v "$CACHE_DIR/npm:/root/.npm" \
  -e WINEDEBUG=-all \
  -e ELECTRON_CACHE="/root/.cache/electron-builder" \
  -e DEBUG="electron-builder" \
  -w /project \
  "$IMAGE" \
  /bin/bash -c '
    set -euo pipefail
    echo "[build:docker] Inicializando Wine..." && \
    wine wineboot --init 2>/dev/null || true && \
    echo "[build:docker] Instalando dependências..." && \
    npm install --ignore-scripts && \
    echo "[build:docker] Recompilando módulos nativos para Electron..." && \
    npx electron-builder install-app-deps && \
    echo "[build:docker] Limpando artefato win-unpacked de builds anteriores..." && \
    rm -rf /project/release/win-unpacked 2>/dev/null || true && \
    echo "[build:docker] Executando build:win..." && \
    npm run build:win
  '

echo "[build:docker] Verificando instalador gerado..."
EXE_COUNT=$(ls -1 "${RELEASE_DIR}/"*.exe 2>/dev/null | wc -l)
if [ "$EXE_COUNT" -eq 0 ]; then
  echo "[build:docker] ERRO: Nenhum instalador .exe foi gerado!"
  ls -la "${RELEASE_DIR}/" 2>/dev/null || true
  exit 1
fi

echo "[build:docker] Build concluído com sucesso!"
echo "[build:docker] Instalador disponível em: ${RELEASE_DIR}/"
ls -lh "${RELEASE_DIR}/"*.exe
