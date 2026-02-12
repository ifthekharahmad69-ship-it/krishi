"""
KrishiSahay - AI Powered Farming Assistant Backend
FastAPI application with OpenAI integration for agricultural support
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import base64
import os
import logging

# Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "sk-YOUR_OPENAI_API_KEY_HERE")
if OPENAI_API_KEY.startswith("sk-"):
    openai.api_key = OPENAI_API_KEY
else:
    print("⚠️  WARNING: No valid OpenAI API key found. Using mock responses.")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="KrishiSahay API",
    description="AI-powered farming assistant API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data Models
class Question(BaseModel):
    question: str

class Response(BaseModel):
    answer: str
    source: str = "AI"

class ImageAnalysisResponse(BaseModel):
    analysis: str
    disease: str = ""
    treatment: str = ""

# Utility Functions
def get_mock_response(query: str) -> str:
    """Provide mock response when API key is not available"""
    query_lower = query.lower()
    
    if "disease" in query_lower or "rust" in query_lower:
        return "Rust is a fungal disease. Use sulphur fungicides, ensure proper spacing, and apply every 10-14 days."
    if "pest" in query_lower:
        return "Use integrated pest management: Use neem oil spray, maintain field hygiene, implement crop rotation."
    if "yield" in query_lower:
        return "Increase yield: Use quality seeds, follow proper spacing, apply recommended fertilizers, maintain irrigation, control weeds."
    if "soil" in query_lower:
        return "Soil prep: Conduct soil testing, add organic manure, maintain pH 6.0-7.5, ensure good drainage."
    if "water" in query_lower or "irrigation" in query_lower:
        return "Irrigation: Schedule at critical stages, avoid waterlogging, use drip irrigation, monitor soil moisture."
    if "fertilizer" in query_lower:
        return "Fertilizer: Get soil tested, apply recommended NPK, split applications, use organic fertilizers."
    
    return "Ask me about crop diseases, pests, irrigation, soil, fertilizers, or yield improvement."

async def call_openai_api(messages: list, max_tokens: int = 500) -> str:
    """Call OpenAI API with error handling"""
    try:
        if not openai.api_key or openai.api_key.startswith("sk-YOUR"):
            return None
        
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.7
        )
        return response["choices"][0]["message"]["content"]
    except Exception as e:
        logger.warning(f"OpenAI error: {str(e)}")
        return None

# API Endpoints
@app.get("/")
async def home():
    """Root endpoint"""
    return {
        "message": "🌾 KrishiSahay - AI Farming Assistant",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check"""
    return {"status": "healthy", "service": "KrishiSahay API"}

@app.post("/ask", response_model=Response)
async def ask_ai(data: Question):
    """Process farming question and return response"""
    if not data.question or len(data.question.strip()) == 0:
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    
    try:
        logger.info(f"Processing: {data.question}")
        
        response_text = await call_openai_api([
            {
                "role": "system",
                "content": "You are an expert agricultural advisor. Provide practical farming advice."
            },
            {"role": "user", "content": data.question}
        ])
        
        if not response_text:
            response_text = get_mock_response(data.question)
        
        return Response(answer=response_text, source="OpenAI" if response_text else "Database")
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return Response(
            answer=get_mock_response(data.question),
            source="Database"
        )

@app.post("/analyze-image", response_model=ImageAnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):
    """Analyze crop image for disease detection"""
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Invalid image type")
    
    try:
        contents = await file.read()
        base64_image = base64.b64encode(contents).decode("utf-8")
        logger.info(f"Analyzing: {file.filename}")
        
        response_text = await call_openai_api([
            {
                "role": "system",
                "content": "Analyze crop images for diseases and suggest treatment."
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Analyze this crop for diseases and treatment."},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                ]
            }
        ])
        
        if not response_text:
            response_text = "Upload a clear image of the affected crop area for analysis."
        
        return ImageAnalysisResponse(
            analysis=response_text,
            disease="Complete",
            treatment="See analysis"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@app.post("/chat")
async def chat(data: Question):
    """Chat endpoint"""
    return await ask_ai(data)

# Main Entry Point
if __name__ == "__main__":
    import uvicorn
    
    print("\n" + "="*60)
    print("🌾 KrishiSahay - AI Powered Farming Assistant")
    print("="*60)
    print("\n✅ Starting FastAPI server...")
    print("📍 Server: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    print("\n🔌 Endpoints:")
    print("   POST /ask - Ask questions")
    print("   POST /analyze-image - Analyze images")
    print("   GET /health - Health check")
    print("\n" + "="*60 + "\n")
    
    uvicorn.run("krishi:app", host="0.0.0.0", port=8000, reload=True)