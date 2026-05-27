#!/bin/bash

# Cores para o terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Iniciando Setup e Execução do EasyRota ===${NC}"

# 1. Verificar e instalar pré-requisitos
echo -e "${GREEN}[1/6] Verificando ferramentas...${NC}"

# Função para instalar Mise
if ! command -v mise >/dev/null 2>&1; then
    echo -e "${BLUE}Instalando Mise...${NC}"
    curl https://mise.jdx.dev/install.sh | sh
    export PATH="$HOME/.local/share/mise/bin:$PATH"
    eval "$(mise activate bash)"
fi

# Função para instalar Bun
if ! command -v bun >/dev/null 2>&1; then
    echo -e "${BLUE}Instalando Bun...${NC}"
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Função para instalar Poetry
if ! command -v poetry >/dev/null 2>&1; then
    echo -e "${BLUE}Instalando Poetry...${NC}"
    curl -sSL https://install.python-poetry.org | python3 -
    export PATH="$HOME/.local/bin:$PATH"
fi

# Garantir que as ferramentas instaladas estão no PATH da sessão atual
export PATH="$HOME/.local/share/mise/bin:$HOME/.bun/bin:$HOME/.local/bin:$PATH"

# 2. Configurar variáveis de ambiente
echo -e "${GREEN}[2/6] Configurando ambiente...${NC}"
if [ ! -f api/.env ]; then
    if [ -f api/.env.development ]; then
        cp api/.env.development api/.env
        echo "Arquivo api/.env criado a partir de .env.development"
    else
        echo "SECRET_KEY='django-insecure-test-key-$(date +%s)'" > api/.env
        echo "DEBUG=True" >> api/.env
        echo "Arquivo api/.env gerado automaticamente."
    fi
fi

# 3. Instalar dependências
echo -e "${GREEN}[3/6] Instalando dependências (isso pode demorar)...${NC}"
mise install
bun install --silent
poetry install --no-interaction

# 4. Preparar Banco de Dados
echo -e "${GREEN}[4/6] Preparando banco de dados...${NC}"
poetry run python api/manage.py migrate

# 5. Criar um Superusuário de teste (opcional/silencioso)
echo -e "${GREEN}[5/6] Garantindo que existam dados mínimos...${NC}"
# Aqui poderíamos rodar um script de seed se existisse, por enquanto apenas as migrações bastam para o cadastro.

# 6. Levantar a aplicação
echo -e "${BLUE}=== Lançando Aplicação ===${NC}"
echo -e "${BLUE}Backend rodando em: http://127.0.0.1:8000${NC}"
echo -e "${BLUE}Frontend rodando em: http://localhost:5173${NC}"
echo -e "${BLUE}DICA: O código de e-mail (OTP) aparecerá no log do terminal abaixo!${NC}"
echo -e "${BLUE}Pressione Ctrl+C para encerrar ambos.${NC}"

# Executa ambos em paralelo
# Usamos o poetry run direto para garantir o ambiente correto
(cd api && poetry run python manage.py runserver) & \
bun dev

# Ao encerrar o bun dev (Ctrl+C), mata também o processo do django
trap "kill 0" EXIT
