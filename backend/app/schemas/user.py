from pydantic import BaseModel, EmailStr


class SendOTPRequest(BaseModel):
    full_name: str
    email: EmailStr


class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class VerifyResetOTPRequest(BaseModel):
    email: EmailStr
    otp: str


class CreatePasswordRequest(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    email: str
    name: str = ""


class GoogleCallbackRequest(BaseModel):
    code: str
    code_verifier: str
    redirect_uri: str
