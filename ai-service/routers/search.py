import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

def get_openai():
    return OpenAI(api_key=os.environ["OPENAI_API_KEY"])

def get_supabase():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_KEY"]
    )

class SearchRequest(BaseModel):
    query: str
    match_threshold: float = 0.5
    match_count: int = 10

@router.post("/search")
async def semantic_search(req: SearchRequest):
    openai_client = get_openai()
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=req.query
    )
    query_embedding = response.data[0].embedding

    supabase = get_supabase()
    result = supabase.rpc("match_service_entries", {
        "query_embedding": query_embedding,
        "match_threshold": req.match_threshold,
        "match_count": req.match_count
    }).execute()

    if not result.data:
        return {"results": []}

    client_ids = list(set([r["client_id"] for r in result.data]))
    clients = supabase.table("clients")\
        .select("id, full_name")\
        .in_("id", client_ids)\
        .execute()

    client_map = {c["id"]: c["full_name"] for c in clients.data}

    enriched = [{
        **r,
        "client_name": client_map.get(r["client_id"], "Unknown")
    } for r in result.data]

    return {"results": enriched}


class EmbedRequest(BaseModel):
    service_entry_id: str
    text: str

@router.post("/embed")
async def embed_service_entry(req: EmbedRequest):
    openai_client = get_openai()
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=req.text
    )
    embedding = response.data[0].embedding

    supabase = get_supabase()
    supabase.table("service_entries")\
        .update({"embedding": embedding})\
        .eq("id", req.service_entry_id)\
        .execute()

    return {"status": "embedded"}