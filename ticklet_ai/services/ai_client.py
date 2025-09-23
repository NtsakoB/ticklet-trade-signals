from openai import OpenAI
from ..conf.env import OPENAI_KEY, OPENAI_MODEL

def get_openai() -> OpenAI:
    if not OPENAI_KEY:
        raise RuntimeError("Missing TICKLET_OPENAI_KEY/OPENAI_API_KEY")
    return OpenAI(api_key=OPENAI_KEY)

def get_openai_model() -> str:
    return OPENAI_MODEL