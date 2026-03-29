import os, base64, json
from fastapi import APIRouter, UploadFile, File, HTTPException
from anthropic import Anthropic
import os, base64, json
from fastapi import APIRouter, UploadFile, File, HTTPException
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

def get_client():
    return Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
router = APIRouter()
# client = Anthropic()

@router.post("/intake")
async def photo_to_intake(file: UploadFile = File(...)):
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(400, "Only JPEG, PNG, WebP supported")

    image_data = await file.read()
    b64 = base64.standard_b64encode(image_data).decode("utf-8")

    message = get_client().messages.create(
        model="claude-opus-4-5",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": file.content_type,
                        "data": b64,
                    },
                },
                {
                    "type": "text",
                    "text": """Extract all client intake form fields from this image.
Return ONLY a valid JSON object with these fields (use null if not found):
{
  "full_name": string,
  "dob": string (YYYY-MM-DD format),
  "phone": string,
  "email": string,
  "demographics": {
    "gender": string,
    "language": string,
    "household_size": number
  }
}
Return only the JSON, no explanation, no markdown."""
                }
            ],
        }]
    )

    try:
        extracted = json.loads(message.content[0].text)
    except json.JSONDecodeError:
        raise HTTPException(500, "Failed to parse form fields from image")

    return extracted