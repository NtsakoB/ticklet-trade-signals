# Environment Configuration
# Load and manage environment variables

import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    openai_api_key = os.getenv("OPENAI_API_KEY")

settings = Settings()