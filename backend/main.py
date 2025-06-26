from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import uvicorn
from typing import Dict

from services.ocr_processor import process_pdf_to_image, process_document_image
from services.audio_whisper import process_audio_with_whisper
from services.audio_gemini import process_audio_with_gemini

app = FastAPI(
    title="Contact Center Operation Insights", 
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def docs():
    return RedirectResponse(url="/docs")

@app.post("/audio/whisper", response_model=Dict[str, str])
async def audio_whisper(audio: UploadFile = File(...)):
    """
    Transcribes and translates an audio file using OpenAI's Whisper model.
    """
    # Basic validation for audio content types. Whisper is robust, but this
    # prevents obviously incorrect file types from being processed.
    if not audio.content_type or not audio.content_type.startswith('audio/'):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: '{audio.content_type}'. Please upload a valid audio file."
        )

    try:
        # Read the content of the uploaded audio file into memory
        audio_bytes = await audio.read()

        # Call the dedicated service to process the audio
        result = process_audio_with_whisper(audio_bytes)

        return result

    except Exception as e:
        # Catch exceptions from the audio processing service or file reading
        raise HTTPException(status_code=500, detail=f"Audio processing failed: {str(e)}")
    
@app.post("/audio/gemini", response_model=Dict[str, str])
async def audio_gemini(audio: UploadFile = File(...)):
    """
    Receives an audio file, transcribes it, and translates the transcription
    to English using the Google Gemini 2.5 Pro model.
    """
    if not audio.content_type or not audio.content_type.startswith('audio/'):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: '{audio.content_type}'. Please upload a valid audio file."
        )

    try:
        audio_bytes = await audio.read()

        result = process_audio_with_gemini(audio_bytes=audio_bytes)

        return result

    except Exception as e:
        # Catches exceptions from file reading or the Gemini service
        raise HTTPException(status_code=500, detail=f"Audio processing with Gemini failed: {str(e)}")

@app.post("/image/process-document")
async def process_document(document: UploadFile = File(...)):
    """
    Process uploaded document (image or PDF) and extract information [Model: Gemini 1.5 Flash]
    """
    try:
        # Read file content
        file_bytes = await document.read()
        
        # Handle different file types
        if document.content_type.startswith('image/'): # type: ignore
            # Process image directly
            image_bytes = file_bytes
        elif document.content_type == 'application/pdf':
            # Convert PDF to image first
            image_bytes = process_pdf_to_image(file_bytes)
        else:
            raise HTTPException(
                status_code=400, 
                detail="Unsupported file type. Please upload an image (JPG, PNG, etc.) or PDF file."
            )
        
        # Process the document
        result = process_document_image(image_bytes, document.filename)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "document-processor"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,            
        reload_dirs=["."]       
    )