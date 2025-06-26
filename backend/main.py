from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
import uvicorn

from services.ocr_processor import process_pdf_to_image, process_document_image

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