# Document Processor - Image to Insights OCR

A powerful document processing application that uses Google's Gemini AI to extract structured information from bank documents and other forms. The application provides both a modern web interface and a robust API backend.

## Features

- **Advanced OCR**: Uses Google Gemini 1.5 Flash for high-accuracy text extraction
- **Document Classification**: Automatically identifies document types (deposit slips, withdrawal slips, customer info sheets)
- **Structured Data Extraction**: Converts unstructured documents into structured JSON data
- **Quality Metrics**: Provides spelling error rate, perplexity, and character error rate
- **Modern UI**: Beautiful, responsive React frontend with drag-and-drop file upload
- **RESTful API**: FastAPI backend with comprehensive error handling

## Supported Document Types

- **Deposit Slip Front**: Account details, amounts, dates
- **Deposit Slip Back**: Cash breakdowns, endorsements
- **Withdrawal Slip Front**: Account holder information, signatures
- **Withdrawal Slip Back**: Transaction breakdowns, denominations
- **Customer Information Sheet**: Personal details, contact information, financial data

## Project Structure

```
doc-processor/
├── backend/
│   ├── main.py              # FastAPI server
│   ├── ocr_processor.py     # Core OCR processing logic
│   ├── requirements.txt     # Python dependencies
│   └── start_server.py      # Server startup script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileUpload.js    # File upload component
│   │   │   └── ResultDisplay.js # Results display component
│   │   └── App.js              # Main React app
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 16+
- Google Gemini API key

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file in the backend directory:
   ```bash
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=8000
   ```

5. **Start the backend server:**
   ```bash
   python start_server.py
   ```

   The API will be available at:
   - Main API: http://localhost:8000
   - Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/api/health

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

   The frontend will be available at: http://localhost:3000

## Usage

### Web Interface

1. Open http://localhost:3000 in your browser
2. Drag and drop or click to upload a document image
3. Wait for processing (usually 10-30 seconds)
4. View extracted data and quality metrics

### API Usage

**Upload and process a document:**
```bash
curl -X POST "http://localhost:8000/api/process" \
  -H "Content-Type: multipart/form-data" \
  -F "document=@your_document.png"
```

**Response format:**
```json
{
  "document_type": "customer information sheet",
  "extracted": {
    "document_type": "Customer Information Sheet",
    "personal_information": {
      "last_name": "SANTIAGO",
      "first_name": "Kelsey",
      "middle_name": "Santos"
    }
  },
  "metrics": {
    "ser": 0.05,
    "ppl": 2.34,
    "refined_ser": 0.03,
    "cer": 0.02
  },
  "raw_text": "..."
}
```

## API Endpoints

- `GET /` - API status
- `GET /api/health` - Health check
- `POST /api/process` - Process document image
- `GET /docs` - Interactive API documentation

## Quality Metrics

The application provides several quality metrics:

- **Spelling Error Rate (SER)**: Percentage of misspelled words
- **Perplexity (PPL)**: Language model perplexity score
- **Refined SER**: Enhanced spelling error detection
- **Character Error Rate (CER)**: Character-level accuracy (when ground truth available)

## Error Handling

The application includes comprehensive error handling:

- **File validation**: Ensures uploaded files are images
- **API error handling**: Graceful handling of Gemini API errors
- **Network error handling**: Clear messages for connection issues
- **Processing timeouts**: 60-second timeout for processing

## Development

### Backend Development

- The backend uses FastAPI with automatic reload
- API documentation is auto-generated at `/docs`
- CORS is configured for local development

### Frontend Development

- React with modern hooks and functional components
- Responsive design with CSS-in-JS styling
- Drag-and-drop file upload with visual feedback

## Troubleshooting

### Common Issues

1. **"Network error: Unable to connect to server"**
   - Ensure the backend server is running on port 8000
   - Check if the port is not blocked by firewall

2. **"Server error: Processing failed"**
   - Verify your Gemini API key is valid
   - Check the backend logs for detailed error messages

3. **"File must be an image"**
   - Ensure you're uploading an image file (JPG, PNG, etc.)
   - Check file extension and content type

4. **Slow processing**
   - Large images may take longer to process
   - Consider resizing images before upload

### Logs

Backend logs are displayed in the terminal where you started the server. Look for:
- Processing status messages
- Error details
- API response information

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation at `/docs`
3. Check the backend logs for error details 