"""Easy Rota's backend API."""

from fastapi import FastAPI

app = FastAPI()


@app.get("/")
async def greet() -> dict[str, str]:
    """Greet the user."""
    return {"message": "Hello World"}
