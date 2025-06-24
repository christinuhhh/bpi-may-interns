from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from ocr_processor import process_document_image
import uvicorn
import io
from PIL import Image
import PyPDF2
from pdf2image import convert_from_bytes

app = FastAPI(title="Document Processor API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def process_pdf_to_image(pdf_bytes):
    """
    Convert PDF to image for processing
    """
    try:
        # Convert PDF to images (first page only)
        images = convert_from_bytes(pdf_bytes, first_page=1, last_page=1)
        if not images:
            raise Exception("Could not convert PDF to image")
        
        # Convert PIL image to bytes
        img_byte_arr = io.BytesIO()
        images[0].save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()
        
        return img_byte_arr
    except Exception as e:
        raise Exception(f"PDF processing failed: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Document Processor API is running"}

@app.post("/api/process")
async def process_document(document: UploadFile = File(...)):
    """
    Process uploaded document (image or PDF) and extract information
    """
    try:
        # Read file content
        file_bytes = await document.read()
        
        # Handle different file types
        if document.content_type.startswith('image/'):
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

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "document-processor"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000) 