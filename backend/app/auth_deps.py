"""
Authentication dependencies for protected endpoints.
Extracts the current user from JWT token in Authorization header.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.user import User
from app.security import SECRET_KEY, ALGORITHM

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User | None:
    """
    Extracts the authenticated user from the JWT token.
    Returns None if no token is provided (optional auth).
    Raises 401 if token is invalid or expired.
    """
    if credentials is None:
        return None

    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str | None = payload.get("sub")
        if email is None:
            return None
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


def require_user(
    user: User | None = Depends(get_current_user),
) -> User:
    """Like get_current_user but raises 401 if no token."""
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    return user
