# EasyRota

## Contributing

Please read the project guides before contributing:

- [Django Best Practices](./docs/django-best-practices.md)

- [React Best Practices](./docs/react-best-practices.md)

- UX/UI Guide: Specific guidelines for front-end development are available in [Development Guide for UX/UI](./docs/UX.md).

- Technical and Onboarding Guide (Sphinx): Detailed architectural overview, backend logic, and coding standards.
Execute mise `run api.docs.serve` and access http://127.0.0.1:5000.

- API Interactive Reference (Swagger): Real-time endpoint testing and schema validation.
Available at  _http://127.0.0.1:8000/api/docs/_ during backend execution.


---

## Tooling

This repository uses:

- **mise** for pinned runtimes and task automation  
- **bun** for the frontend  
- **python + poetry** for the backend  

Pinned versions are managed in [mise.toml](mise.toml).

---

## Prerequisites

Install:

- [Mise](https://mise.jdx.dev/) 
- [Poetry](https://python-poetry.org/)  


## Quick Start

Clone the repository and create your environment file:

```bash
cp api/.env.development api/.env
```

Install tools and dependencies:

```bash
mise install
bun install
poetry install
```

This installs:

- frontend dependencies from [package.json](package.json)
- backend dependencies from [pyproject.toml](pyproject.toml) and [poetry.lock](poetry.lock)

Run database migrations:

```bash
mise run api.migrate
```

Start backend:

```bash
mise run api.server
```

Start frontend:

```bash
bun dev
```

Applications available at:

- Frontend: http://localhost:5173  
- Backend API: http://127.0.0.1:8000

---

## OpenAPI Documentation

Interactive API documentation: http://127.0.0.1:8000/api/docs/

Raw OpenAPI schema: http://127.0.0.1:8000/api/schema/

---

## Common Development Commands

### Backend

```bash
mise run api.migrate
mise run api.makemigrations
mise run api.server
mise run api.test
mise run api.test.cov
mise run api.lint
mise run api.formatter
```

### Frontend

```bash
bun run dev
bun run build
bun run lint
```

### Documentation

```bash
mise run api.docs.serve
mise run api.docs.build
```
 

