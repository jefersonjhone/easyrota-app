#!/bin/bash
# run_all.sh - Setup e execução completa para testes de notificação

echo "--- Limpando banco de dados antigo ---"
rm -f api/db.sqlite3

echo "--- Preparando banco de dados e dados de teste ---"
cd api
# Cria as migrações se houver mudanças pendentes
poetry run python manage.py makemigrations
# Aplica as migrações
poetry run python manage.py migrate
# Carrega os dados permitidos
poetry run python manage.py loaddata apps/users/fixtures/allowed_staff.json
# Cria a viagem de teste e o admin
poetry run python manage.py seed_test_trip
cd ..

echo "--- Iniciando processos em paralelo ---"
# Backend
(cd api && poetry run python manage.py runserver) & 
# Scheduler (Crucial para as notificações)
(cd api && poetry run python manage.py run_scheduler) & 
# Frontend
bun dev &

trap "kill 0" EXIT
wait
