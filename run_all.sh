#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$ROOT_DIR/api"

export PATH="$HOME/.local/share/mise/bin:$HOME/.bun/bin:$HOME/.local/bin:$PATH"

echo "--- Verificando ferramentas ---"
if ! command -v mise >/dev/null 2>&1; then
  echo "mise não encontrado"
  exit 1
fi
if ! command -v bun >/dev/null 2>&1; then
  echo "bun não encontrado"
  exit 1
fi
if ! command -v poetry >/dev/null 2>&1; then
  echo "poetry não encontrado"
  exit 1
fi

echo "--- Garantindo variáveis de ambiente ---"
if [ ! -f "$API_DIR/.env" ]; then
  if [ -f "$API_DIR/.env.development" ]; then
    cp "$API_DIR/.env.development" "$API_DIR/.env"
  else
    cat > "$API_DIR/.env" <<'EOF'
SECRET_KEY='django-insecure-test-key'
DEBUG=True
EOF
  fi
fi

echo "--- Instalando dependências ---"
mise install
bun install --silent
poetry install --no-interaction

echo "--- Preparando banco de dados ---"
if [ "${RESET_DB:-0}" = "1" ]; then
  rm -f "$API_DIR/db.sqlite3"
  echo "Banco removido porque RESET_DB=1"
fi
cd "$API_DIR"
poetry run python manage.py makemigrations
poetry run python manage.py migrate
poetry run python manage.py loaddata apps/users/fixtures/allowed_staff.json
poetry run python manage.py seed_test_trip

echo "--- Iniciando aplicação completa ---"
echo "Backend:   http://127.0.0.1:8000"
echo "Frontend:  http://localhost:5173"
echo "Scheduler: Iniciando em 3 segundos..."

trap 'kill 0' EXIT
(poetry run python manage.py runserver) &
(sleep 3 && echo "--- Agendador Ativo ---" && poetry run python manage.py run_scheduler) &
cd "$ROOT_DIR"
bun dev
