"""US01/US02 - hachage des mots de passe, jetons JWT et dépendance d'authentification."""

import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User

JWT_SECRET = os.getenv("JWT_SECRET", "change-me-dev-secret-at-least-32-bytes")
JWT_ALGORITHM = "HS256"
TOKEN_TTL = timedelta(hours=24)

bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_token(user_id: int) -> str:
    expires = datetime.now(timezone.utc) + TOKEN_TTL
    return jwt.encode({"sub": str(user_id), "exp": expires}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=401,
        detail="Authentification requise.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    """Refuse toute requête sans jeton valide (critère d'acceptation US02)."""
    if credentials is None:
        raise _unauthorized()
    try:
        claims = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = db.get(User, int(claims["sub"]))
    except (jwt.InvalidTokenError, KeyError, ValueError):
        raise _unauthorized() from None
    if user is None:
        raise _unauthorized()
    return user
