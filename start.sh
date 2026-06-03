#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$ROOT_DIR/api"

cleanup() {
    echo ""
    echo "Finalizando aplicação..."
    trap - INT TERM EXIT
    kill 0
}

trap cleanup INT TERM EXIT

export DJANGO_SETTINGS_MODULE="config.settings.development"

echo "Iniciando EasyRota com suporte a push..."
echo "Preparando banco de dados..."

"$ROOT_DIR/.venv/bin/python" "$API_DIR/manage.py" migrate
"$ROOT_DIR/.venv/bin/python" "$API_DIR/manage.py" setup_test_push

echo "Iniciando Backend (Django) na porta 8000..."
"$ROOT_DIR/.venv/bin/python" "$API_DIR/manage.py" runserver 0.0.0.0:8000 &

echo "Iniciando Scheduler de notificações..."
(sleep 3 && "$ROOT_DIR/.venv/bin/python" "$API_DIR/manage.py" run_scheduler) &

echo "Iniciando Frontend (Vite) na porta 5173..."
npm run dev &

echo "----------------------------------------"
echo "Aplicação rodando!"
echo "Backend:   http://localhost:8000"
echo "Frontend:  http://localhost:5173"
echo "Teste push: logue como aluno-teste@test.com / 12345678"
echo "Ative Push em Configurações e depois rode:"
echo "DJANGO_SETTINGS_MODULE=config.settings.development ./.venv/bin/python api/manage.py setup_test_push --trigger"
echo "Pressione Ctrl+C para parar tudo."
echo "----------------------------------------"

wait
