from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ocr_processor import process_document_image
import uvicorn

app = FastAPI(title="Document Processor API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Document Processor API is running"}

@app.post("/api/process")
async def process_document(document: UploadFile = File(...)):
    """
    Process uploaded document image and extract information
    """
    try:
        # Validate file type
        if not document.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read file content
        image_bytes = await document.read()
        
        # Process the document
        result = process_document_image(image_bytes, document.filename)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "document-processor"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 