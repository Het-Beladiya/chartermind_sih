import logging
from typing import List
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

logger = logging.getLogger("uvicorn.error")


def setup_cors(app: FastAPI) -> None:
    """
    Configure Cross-Origin Resource Sharing (CORS) middleware on the FastAPI application.
    
    Rules:
    - In DEBUG mode, enables flexible origins matching localhost and development frontends.
    - In Production, strictly enforces ALLOWED_ORIGINS parsed from settings.
    - Permits standard maritime REST verbs (GET, POST, PUT, DELETE, OPTIONS, PATCH).
    - Enables credentials and authorization header transmission.
    """
    allowed_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    allowed_headers = ["*"]

    if settings.DEBUG:
        logger.info("CORS configured for development mode (allowing localhost and wildcard origins).")
        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
            allow_credentials=True,
            allow_methods=allowed_methods,
            allow_headers=allowed_headers,
        )
    else:
        origins: List[str] = settings.allowed_origins_list
        logger.info(f"CORS configured for production with allowed origins: {origins}")
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=allowed_methods,
            allow_headers=allowed_headers,
        )
