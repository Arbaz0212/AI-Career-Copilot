import os
from google import genai
from google.genai.errors import APIError


def load_env_manually():
    if os.path.exists(".env"):
        with open(".env", "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip().strip('"').strip("'")
        print("✅ Successfully read your .env file!")
    else:
        print("❌ Could not find a .env file in this folder.")


if __name__ == "__main__":
    print("🤖 STARTING API CONNECTION TEST...")
    load_env_manually()

    key_1 = os.getenv("GEMINI_API_KEY_1")
    key_2 = os.getenv("GEMINI_API_KEY_2")
    key_std = os.getenv("GEMINI_API_KEY")

    active_key = key_1 or key_2 or key_std

    if not active_key:
        print("❌ Error: No API key found in memory or your .env file.")
    elif "YourActualKey" in active_key:
        print("❌ Error: You are still using the placeholder text! Put your real key in the .env file.")
    else:
        masked = f"{active_key[:4]}...{active_key[-4:]}" if len(active_key) > 8 else "***"
        print(f"🔑 Testing Key: {masked}")

        try:
            client = genai.Client(api_key=active_key)
            print("Connecting to Google servers using gemini-2.5-flash...")

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents="Say 'API Connection Successful!'"
            )
            print("🎉 Success! Your API key is active and connected perfectly.")
            print(f"🤖 Gemini response: '{response.text.strip()}'")
        except APIError as e:
            print(f"❌ API Error Code {e.code}: {e.message}")
        except Exception as e:
            print(f"❌ Connection error: {str(e)}")