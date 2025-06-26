---
title: Contact Center Operations
emoji: ⚡
colorFrom: red
colorTo: green
sdk: docker
pinned: false
license: mit
short_description: Contact Center Operation Insights
---

# Contact Center Operations

A FastAPI application for contact center operation insights and analytics.

## System Requirements

This application requires FFmpeg for audio processing capabilities.

## Local Development Setup

Follow these steps to run the FastAPI application locally on your machine.

### Prerequisites

- Python 3.11
- Git
- FFmpeg (for audio processing)

### Installing FFmpeg

**On Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**On macOS:**
```bash
brew install ffmpeg
```

**On Windows:**
Download from [FFmpeg official site](https://ffmpeg.org/download.html) and add to PATH.

### Installation

1. **Clone the repository**
   ```bash
   git clone 
   ```

2. **Create a virtual environment**

   **Option A: Using venv**
   ```bash
   python3.11 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

   **Option B: Using conda**
   ```bash
   conda create -n contact-center python=3.11
   conda activate contact-center
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   Create a `.env` file in the backend directory:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

5. **Run the application**
   ```bash
   python api.py
   ```

The FastAPI application will start and be available at `http://localhost:8000`.

### API Documentation

Once the application is running, you can access:
- Interactive API documentation: `http://localhost:8000/docs`
- Alternative API documentation: `http://localhost:8000/redoc`

### Deactivating the Environment

When you're done working with the application:

**For venv:**
```bash
deactivate
```

**For conda:**
```bash
conda deactivate
```

---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference