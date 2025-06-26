from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import uvicorn
from typing import Any, Dict
from pydantic import BaseModel

from services.audio_whisper import process_audio_with_whisper
from services.audio_gemini import process_audio_with_gemini
from services.audio_diarization import process_audio_diarization, AudioDiarizationError
from services.image_ocr_processor import process_pdf_to_image, process_document_image

class TextRequest(BaseModel):
    text: str


class HelloWorldResponse(BaseModel):
    message: str
    received_text: str
    status: str

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

@app.post("/audio/diarization")
async def audio_diarization(audio: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Process audio file for speaker diarization using Google Gemini 2.5 Pro.
    
    This endpoint accepts audio files and returns speaker diarization results,
    identifying different speakers and their spoken text segments throughout
    the conversation.
    """
    # Validate file type - accept common audio formats
    if not audio.content_type or not audio.content_type.startswith('audio/'):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: '{audio.content_type}'. Please upload a valid audio file (WAV, MP3, MP4, M4A)."
        )
    
    # Additional validation for specific audio formats that work well with diarization
    supported_types = [
        'audio/wav', 'audio/wave', 'audio/x-wav',
        'audio/mpeg', 'audio/mp3',
        'audio/mp4', 'audio/m4a', 'audio/x-m4a'
    ]
    
    if audio.content_type not in supported_types:
        # Still allow processing but warn about potential issues
        pass  # Gemini is quite robust with audio formats
    
    try:
        # Read the uploaded audio file content
        audio_bytes = await audio.read()
        
        # Validate file size (optional - adjust based on your needs)
        max_size_mb = 100  # 100MB limit
        if len(audio_bytes) > max_size_mb * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size allowed is {max_size_mb}MB."
            )
        
        # Validate minimum file size to ensure it's not empty
        if len(audio_bytes) < 1000:  # Less than 1KB
            raise HTTPException(
                status_code=400,
                detail="File appears to be empty or too small to process."
            )
        
        # Process the audio file for speaker diarization
        result = process_audio_diarization(
            audio_bytes=audio_bytes, 
            filename=audio.filename # type: ignore
        )
        
        return result
        
    except AudioDiarizationError as e:
        # Handle specific diarization errors with appropriate HTTP status
        if "API key" in str(e).lower():
            raise HTTPException(
                status_code=500, 
                detail="Audio diarization service configuration error. Please contact support."
            )
        elif "format" in str(e).lower():
            raise HTTPException(
                status_code=400,
                detail=f"Audio format error: {str(e)}"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Audio diarization failed: {str(e)}"
            )
            
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
        
    except Exception as e:
        # Catch any unexpected errors
        raise HTTPException(
            status_code=500, 
            detail=f"Unexpected error during audio diarization: {str(e)}"
        )

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
    
@app.post("/text", response_model=HelloWorldResponse)
async def text_insights(request: TextRequest) -> HelloWorldResponse:
    """
    Simple text to insights endpoint
    """
    try:
        # Basic validation
        if not request.text.strip():
            raise HTTPException(
                status_code=400,
                detail="Text cannot be empty or contain only whitespace."
            )
        
        response = HelloWorldResponse(
            message="Hello World! Text processing completed successfully.",
            received_text=request.text,
            status="success"
        )
        
        return response
        
    except HTTPException:
        raise
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected error processing text: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "document-processor"}

if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,            
        reload_dirs=["."]       
    )