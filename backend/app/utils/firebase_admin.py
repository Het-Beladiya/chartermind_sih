import asyncio
import json
import logging
import os
from typing import Any, Dict, Optional
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials

from app.config import settings

logger = logging.getLogger("uvicorn.error")

_firebase_app: Optional[firebase_admin.App] = None
_is_mock_mode: bool = False


def initialize_firebase() -> Optional[firebase_admin.App]:
    """
    Initialize Firebase Admin SDK using singleton pattern.
    
    Order of credential resolution:
    1. Raw JSON string from FIREBASE_SERVICE_ACCOUNT_JSON (cloud container environments)
    2. File path from FIREBASE_SERVICE_ACCOUNT_PATH (serviceAccount.json)
    3. GOOGLE_APPLICATION_CREDENTIALS environment variable
    4. Development mock fallback (if DEBUG=True and credentials absent)
    """
    global _firebase_app, _is_mock_mode

    # Check if default app is already initialized
    if firebase_admin._apps and "[DEFAULT]" in firebase_admin._apps:
        _firebase_app = firebase_admin.get_app()
        logger.info("Firebase Admin SDK already initialized. Reusing default app instance.")
        return _firebase_app

    cred = None
    options: Dict[str, Any] = {}
    if settings.FIREBASE_PROJECT_ID and settings.FIREBASE_PROJECT_ID != "your-firebase-project-id":
        options["projectId"] = settings.FIREBASE_PROJECT_ID

    # 1. Check raw JSON string (cloud deployment)
    if settings.FIREBASE_SERVICE_ACCOUNT_JSON:
        try:
            cert_dict = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
            cred = credentials.Certificate(cert_dict)
            logger.info("Loaded Firebase credentials from FIREBASE_SERVICE_ACCOUNT_JSON environment variable.")
        except Exception as err:
            logger.error(f"Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON: {err}")

    # 2. Check JSON file path
    if cred is None and settings.FIREBASE_SERVICE_ACCOUNT_PATH:
        cert_path = settings.FIREBASE_SERVICE_ACCOUNT_PATH
        if os.path.exists(cert_path):
            try:
                cred = credentials.Certificate(cert_path)
                logger.info(f"Loaded Firebase credentials from file: {cert_path}")
            except Exception as err:
                logger.error(f"Failed to load service account file '{cert_path}': {err}")
        else:
            missing_msg = (
                f"\n{'='*70}\n"
                f"FIREBASE SERVICE ACCOUNT FILE NOT FOUND: '{cert_path}'\n"
                f"To set up real Firebase Authentication:\n"
                f"1. Go to Firebase Console (https://console.firebase.google.com)\n"
                f"2. Navigate to: Project Settings -> Service Accounts\n"
                f"3. Click 'Generate new private key' and save as '{cert_path}'\n"
                f"   in the backend root directory.\n"
                f"{'='*70}\n"
            )
            print(missing_msg)
            logger.warning(f"Firebase service account file '{cert_path}' not found.")

    # 3. Attempt initialization
    try:
        if cred:
            _firebase_app = firebase_admin.initialize_app(cred, options=options)
            _is_mock_mode = False
            logger.info("Firebase Admin SDK initialized successfully with service account.")
            return _firebase_app
        elif os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            _firebase_app = firebase_admin.initialize_app(options=options)
            _is_mock_mode = False
            logger.info("Firebase Admin SDK initialized using Application Default Credentials.")
            return _firebase_app
        else:
            if settings.DEBUG:
                logger.warning(
                    "Running in development mode without Firebase credentials. "
                    "Mock authentication is enabled for demo/testing tokens (e.g. 'demo-*')."
                )
                _is_mock_mode = True
                return None
            else:
                # In production, attempt default app initialization (will raise if unauthenticated)
                _firebase_app = firebase_admin.initialize_app(options=options)
                return _firebase_app
    except Exception as err:
        if settings.DEBUG:
            logger.warning(f"Firebase initialization bypassed in DEBUG mode: {err}")
            _is_mock_mode = True
            return None
        logger.error(f"Critical error initializing Firebase Admin SDK: {err}")
        raise


def get_firebase_app() -> Optional[firebase_admin.App]:
    """Retrieve the initialized Firebase App singleton instance."""
    global _firebase_app
    if _firebase_app is None and not _is_mock_mode:
        return initialize_firebase()
    return _firebase_app


def is_mock_mode() -> bool:
    """Return True if running in local development mock authentication mode."""
    return _is_mock_mode


def verify_id_token_sync(token: str) -> Dict[str, Any]:
    """Synchronously verify Firebase ID token using firebase_admin.auth."""
    if _is_mock_mode or (settings.DEBUG and token.startswith("demo-")):
        logger.debug("Verifying token via development mock fallback.")
        raw_val = token.replace("demo-", "").replace("Bearer ", "").strip()
        if "@" in raw_val:
            user_part = raw_val.split("@")[0]
            email = raw_val.lower()
            safe_id = user_part.replace(".", "_")
            safe_name = user_part.replace(".", " ").title()
        else:
            safe_id = raw_val or "demo_user"
            safe_name = safe_id.replace("-", " ").replace(".", " ").title()
            email = f"{safe_id.lower()}@maritime-sih.in"

        return {
            "uid": f"firebase_{safe_id}",
            "email": email,
            "name": safe_name,
            "picture": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        }

    app = get_firebase_app()
    return firebase_auth.verify_id_token(token, app=app, check_revoked=True)


async def verify_id_token_async(token: str) -> Dict[str, Any]:
    """
    Async-safe verification of Firebase ID token.
    Runs the blocking network call inside a thread pool executor.
    """
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, verify_id_token_sync, token)


# Export convenient aliases
verify_firebase_token = verify_id_token_sync
verify_id_token = verify_id_token_sync

# Initialize singleton on import
initialize_firebase()
