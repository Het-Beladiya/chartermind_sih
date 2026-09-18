"""
CharterMind Standalone Machine Learning Microservice Launcher.
Runs independently on port 8001 to prevent port conflicts with the primary backend (port 8000).
"""
import os
import sys
import uvicorn

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8001"))
    host = os.getenv("HOST", "127.0.0.1")
    dev_mode = "--dev" in sys.argv or os.getenv("DEBUG", "false").lower() == "true"

    banner = (
        f"\n{'='*70}\n"
        f"  CharterMind Standalone ML Microservice\n"
        f"  Running on: http://{host}:{port}\n"
        f"  Swagger Docs: http://{host}:{port}/docs\n"
        f"  Note: Primary Full-Stack Backend runs on port 8000\n"
        f"{'='*70}\n"
    )
    print(banner)

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=dev_mode,
        reload_dirs=["app"] if dev_mode else None,
        log_level="info",
    )
