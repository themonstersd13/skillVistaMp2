from src.config import get_settings
from dotenv import load_dotenv

load_dotenv(override=True)
s = get_settings()
print(repr(s.cors_origins))
