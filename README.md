# EasyRota

## Tooling

This repository uses:

- `mise` to install the pinned toolchain from [mise.toml](mise.toml)
- `bun` for the Vite frontend
- `python` and `poetry` for the FastAPI backend package

## Prerequisites

Install `mise` and `poetry` on your machine if they are not already available.

The repository pins these tool versions in [mise.toml](mise.toml):

- Bun `1.3.12`
- Python `3.12`

## Bootstrap

From the repository root:

```sh
mise install
```

That installs the tool versions declared in [mise.toml](mise.toml).

Then install the project dependencies:

```sh
bun install
poetry install
```

`bun install` restores the frontend dependencies defined in [package.json](package.json), and `poetry install` creates the backend virtual environment from [pyproject.toml](pyproject.toml) and [poetry.lock](poetry.lock).

## Run locally

Start the frontend:

```sh
bun dev
```

Start the backend:

```sh
poetry run fastapi dev easy:app
```

If you prefer Uvicorn directly, this also works:

```sh
poetry run uvicorn easy:app --reload
```

## Common checks

```sh
bun run build
bun run lint
```

## Notes

The backend app is currently a minimal FastAPI application defined in [easy/__init__.py](easy/__init__.py).
