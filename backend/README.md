# Document Processor Backend

This is the FastAPI backend for the Document Processor application that uses Google's Gemini AI to extract structured information from bank documents.

## Setup Instructions

### 1. Environment Variables

To use this application, you need to set up your Gemini API key:

1. **Get your Gemini API key:**
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the API key

2. **Create a `.env` file:**
   ```bash
   # In the backend directory, create a .env file
   cp env_template.txt .env
   ```

3. **Edit the `.env` file:**
   ```bash
   # Replace 'your_actual_api_key_here' with your real API key
   GEMINI_API_KEY=your_actual_api_key_here
   ```

### 2. Install Dependencies

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Run the Server

```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will be available at `http://localhost:8000`

## API Endpoints

- `GET /` - Health check
- `GET /api/health` - Detailed health check
- `POST /api/process` - Process uploaded documents

## Security Notes

- The `.env` file is automatically ignored by git to prevent accidentally committing your API key
- Never commit your actual API key to version control
- Keep your API key secure and don't share it publicly

## Troubleshooting

If you get an error about `GEMINI_API_KEY not set in environment`, make sure:
1. You've created the `.env` file in the backend directory
2. You've added your actual API key to the file
3. The virtual environment is activated when running the server 