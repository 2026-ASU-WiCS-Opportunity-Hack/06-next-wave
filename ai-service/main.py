from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import intake, search
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="CareTrack AI Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://localhost:3001","https://06-next-wave.vercel.app/","*","http://localhost:3000",
    "https://06-next-wave.vercel.app",
    "https://zero6-next-wave.onrender.com"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(intake.router, prefix="/ai")
app.include_router(search.router, prefix="/ai")

@app.get("/health")
def health():
    return {"status": "ok"}