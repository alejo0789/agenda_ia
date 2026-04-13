from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    webchat_backend: str = "https://largebotinterfaz-production-5b38.up.railway.app/api"
    web_chat_security: str = "IA_w1232_r3quest_20dos?"
    lizto_email: str | None = None
    lizto_password: str | None = None
    base_url: str = "https://largebotinterfaz-production-5b38.up.railway.app"

    class Config:
        env_file = ".env"

settings = Settings()
