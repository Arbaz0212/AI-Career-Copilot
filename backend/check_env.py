# check_env.py

from dotenv import load_dotenv
import os

load_dotenv()

print("EMAIL_USER =", os.getenv("EMAIL_USER"))
print("EMAIL_PASSWORD =", os.getenv("EMAIL_PASSWORD"))