from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import logging

from app.database.db import get_db
from app.models.user import User

from app.schemas.user import (
    SendOTPRequest,
    VerifyOTPRequest,
    VerifyResetOTPRequest,
    CreatePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserLogin,
    GoogleAuthRequest,
)

from app.utils.otp import generate_otp
from app.services.email_service import send_otp_email

from app.security import (
    hash_password,
    verify_password,
    create_access_token,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── SIGNUP FLOW ────────────────────────────────────────────────────────────────

@router.post("/send-otp")
def send_otp(user: SendOTPRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user and existing_user.is_verified and existing_user.password:
        raise HTTPException(status_code=400, detail="User already exists. Please login.")
    otp = generate_otp()
    now = datetime.now(timezone.utc)
    expiry = now + timedelta(minutes=10)
    if existing_user:
        existing_user.full_name = user.full_name
        existing_user.otp = otp
        existing_user.otp_expiry = expiry
        existing_user.otp_sent_at = now
    else:
        new_user = User(
            full_name=user.full_name, email=user.email,
            otp=otp, otp_expiry=expiry, otp_sent_at=now,
            is_verified=False, auth_provider="email",
            reviewer_scans=1, jd_scans=1,
        )
        db.add(new_user)
    db.commit()
    send_otp_email(user.email, otp)
    return {"message": "OTP sent successfully"}


@router.post("/resend-otp")
def resend_otp(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.otp_sent_at:
        seconds_passed = (datetime.now(timezone.utc) - user.otp_sent_at).total_seconds()
        if seconds_passed < 60:
            raise HTTPException(status_code=400, detail=f"Please wait {int(60 - seconds_passed)} seconds")
    otp = generate_otp()
    user.otp = otp
    user.otp_sent_at = datetime.now(timezone.utc)
    user.otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()
    send_otp_email(user.email, otp)
    return {"message": "OTP resent successfully"}


@router.post("/verify-otp")
def verify_otp(data: VerifyOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.otp != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if user.otp_expiry and datetime.now(timezone.utc) > user.otp_expiry:
        raise HTTPException(status_code=400, detail="OTP expired")
    user.is_verified = True
    user.otp = None
    user.otp_expiry = None
    db.commit()
    return {"message": "OTP verified successfully"}


@router.post("/create-password")
def create_password(data: CreatePasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email first")
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    user.password = hash_password(data.password)
    db.commit()
    return {"message": "Account created successfully"}


# ── EMAIL LOGIN ─────────────────────────────────────────────────────────────────

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found. Please signup first.")
    if not existing_user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email first.")
    if not existing_user.password:
        raise HTTPException(status_code=403, detail="Please create a password first.")
    if not verify_password(user.password, existing_user.password):
        raise HTTPException(status_code=401, detail="Wrong password. Try again.")
    existing_user.last_login = datetime.now(timezone.utc)
    db.commit()
    token = create_access_token({"sub": existing_user.email})
    return {
        "message": "Login successful",
        "access_token": token, "token_type": "bearer",
        "user_id": existing_user.id,
        "email": existing_user.email,
        "full_name": existing_user.full_name,
    }


# ── GOOGLE OAUTH ────────────────────────────────────────────────────────────────

@router.post("/google")
def google_auth(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    if not data.email:
        raise HTTPException(status_code=400, detail="Email is required from Google")

    now = datetime.now(timezone.utc)

    try:
        existing_user = db.query(User).filter(User.email == data.email).first()

        if not existing_user:
            new_user = User(
                full_name=data.name or data.email.split("@")[0],
                email=data.email,
                is_verified=True,
                auth_provider="google",
                last_login=now,
                reviewer_scans=1, jd_scans=1,
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            logger.info(f"Created user via Google: {data.email} (id={new_user.id})")
            existing_user = new_user
        else:
            existing_user.last_login = now
            if data.name and not existing_user.full_name:
                existing_user.full_name = data.name
            if not existing_user.is_verified:
                existing_user.is_verified = True
            db.commit()
            logger.info(f"Updated user via Google: {data.email} (id={existing_user.id})")

        token = create_access_token({"sub": existing_user.email})
        return {
            "message": "Login successful",
            "access_token": token, "token_type": "bearer",
            "user_id": existing_user.id,
            "email": existing_user.email,
            "full_name": existing_user.full_name or existing_user.email.split("@")[0],
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Google auth error for {data.email}: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ── PASSWORD RESET ─────────────────────────────────────────────────────────────

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    otp = generate_otp()
    user.otp = otp
    user.otp_sent_at = datetime.now(timezone.utc)
    user.otp_expiry = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()
    send_otp_email(user.email, otp)
    return {"message": "Password reset OTP sent"}


@router.post("/verify-reset-otp")
def verify_reset_otp(data: VerifyResetOTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.otp != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if user.otp_expiry and datetime.now(timezone.utc) > user.otp_expiry:
        raise HTTPException(status_code=400, detail="OTP expired")
    user.reset_verified = True
    db.commit()
    return {"message": "Reset OTP verified successfully"}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.reset_verified:
        raise HTTPException(status_code=403, detail="Verify reset OTP first")
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    user.password = hash_password(data.password)
    user.reset_verified = False
    user.otp = None
    user.otp_expiry = None
    db.commit()
    return {"message": "Password updated successfully"}
