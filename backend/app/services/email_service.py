import os
import smtplib

from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")


def send_otp_email(receiver_email, otp):

    subject = "AI Career Copilot - Email Verification OTP"

    body = f"""
Your verification code is:

{otp}

This code expires in 10 minutes.

AI Career Copilot
"""

    msg = MIMEText(body)

    msg["Subject"] = subject
    msg["From"] = EMAIL_USER
    msg["To"] = receiver_email

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(
            EMAIL_USER,
            EMAIL_PASSWORD
        )
        server.send_message(msg)