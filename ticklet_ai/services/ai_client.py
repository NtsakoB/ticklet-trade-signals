import os
from openai import OpenAI
def get_openai():
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    return OpenAI(api_key=api_key), os.getenv("OPENAI_MODEL","gpt-5-mini")