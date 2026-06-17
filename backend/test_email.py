from app.services.email_service import send_otp_email

send_otp_email(
    "arbazayaan0212@gmail.com",
    "123456"
)

print("Email sent")