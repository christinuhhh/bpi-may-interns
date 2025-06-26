# Contact Center Operation Insights

A comprehensive full-stack application that provides AI-powered insights for contact center operations. Extract structured information from documents, transcribe and analyze audio conversations, and perform speaker diarization using cutting-edge AI models

## 🚀 Features

### Document Processing
- **Advanced OCR**: Extract text and structured data from bank forms and documents
- **Document Classification**: Automatically identify document types (deposit slips, withdrawal forms, customer information sheets)
- **Quality Metrics**: Get accuracy scores including spelling error rates and character error rates
- **Multiple Formats**: Support for images (JPG, PNG, GIF, BMP, TIFF) and PDF files

### Audio Processing
- **Whisper Transcription**: High-accuracy speech-to-text using OpenAI's Whisper model
- **Gemini Audio Processing**: Advanced transcription and translation using Google Gemini 2.5 Pro
- **Speaker Diarization**: Identify different speakers and analyze conversations
- **Multiple Audio Formats**: Support for WAV, MP3, MP4, M4A, FLAC

### Modern Web Interface
- **Responsive Design**: Beautiful, intuitive React interface
- **Drag & Drop**: Easy file uploads with visual feedback
- **Real-time Preview**: Audio playback controls and image zoom functionality
- **Tabbed Interface**: Organized features across multiple tabs

## 🏗️ Architecture

```
contact-center-insights/
├── backend/                 # FastAPI Server
│   ├── api.py              # Main FastAPI application
│   ├── services/           # Processing services
│   │   ├── audio_whisper.py
│   │   ├── audio_gemini.py
│   │   ├── audio_diarization.py
│   │   └── image_ocr_processor.py
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile         # Docker configuration
│   └── .env.example       # Environment template
├── frontend/               # React Vite Application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.tsx        # Main application
│   │   └── main.tsx       # Entry point
│   ├── package.json       # Node.js dependencies
│   └── vite.config.ts     # Vite configuration
└── README.md              # This file
```

## 📋 Prerequisites

### System Requirements
- **Python**: 3.11 or higher
- **Node.js**: 16.0 or higher
- **FFmpeg**: Required for audio processing

### API Keys
- **Google Gemini API Key**: Required for document OCR and audio processing
  - Get your key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Installing FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
1. Download from [FFmpeg official site](https://ffmpeg.org/download.html)
2. Extract and add to your system PATH

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/bpi-may-interns.git # In this case, the username is 'christinuhhh'
cd bpi-may-interns
```

### 2. Backend Setup (FastAPI)

#### Create Virtual Environment

**Option A: Using venv**
```bash
cd backend

# Create a virtual environment
python3.11 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate
```

**Option B: Using conda**
```bash
cd backend
conda create -n contact-center python=3.11
conda activate contact-center
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

1. Copy the example environment file:
```bash
# MacOS
cp .env.example .env
# Windows OS
copy .env.example .env
```

2. Edit `.env` and add your API key:
```bash
GEMINI_API_KEY=your_actual_api_key_here
```

#### Start the Backend Server

```bash
python api.py
```

The backend will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### 3. Frontend Setup (React + Vite)

#### Open New Terminal

```bash
cd frontend
```

#### Install Dependencies

```bash
npm install
```

#### Start Development Server

```bash
npm run dev
```

The frontend will be available at:
- **Application**: http://localhost:5173

## 🎯 Usage Guide

### Document Processing

1. **Navigate** to the "Image to Insights" tab
2. **Upload** a document by:
   - Dragging and dropping a file
   - Clicking to browse and select
3. **Preview** your image with zoom controls
4. **Click** "Analyze Document" to process
5. **View** extracted data and quality metrics

**Supported Document Types:**
- Customer Information Sheets
- Deposit/Payment Slips (Front & Back)
- Withdrawal Slips (Front & Back)

### Audio Processing

#### Whisper Transcription
1. **Navigate** to "Audio to Insights" → "Whisper Transcription"
2. **Upload** an audio file
3. **Preview** with built-in audio player
4. **Process** to get transcription and translation

#### Gemini Processing
1. **Navigate** to "Audio to Insights" → "Gemini Processing"
2. **Upload** an audio file
3. **Process** for advanced AI transcription and translation

#### Speaker Diarization
1. **Navigate** to "Audio to Insights" → "Speaker Diarization"
2. **Upload** a conversation audio file
3. **Analyze** to identify different speakers
4. **View** color-coded speaker segments

## 🔧 Development

### Backend Development

The FastAPI server includes:
- **Auto-reload**: Changes are automatically detected
- **Interactive docs**: Available at `/docs`
- **CORS**: Configured for local development

**Key endpoints:**
- `POST /image/process-document` - Document OCR processing
- `POST /audio/whisper` - Whisper transcription
- `POST /audio/gemini` - Gemini audio processing
- `POST /audio/diarization` - Speaker diarization

### Frontend Development

The React application features:
- **Hot reload**: Instant updates during development
- **TypeScript**: Full type safety
- **Modern React**: Hooks and functional components
- **Responsive design**: Works on all screen sizes

### Running Tests

**Backend:**
```bash
cd backend
python -m pytest tests/
```

**Frontend:**
```bash
cd frontend
npm test
```

## 📦 Production Deployment

### Using Docker (Backend)

```bash
cd backend
docker build -t contact-center-backend .
docker run -p 8000:7860 -e GEMINI_API_KEY=your_key contact-center-backend
```

### Building Frontend for Production

```bash
cd frontend
npm run build
```

The built files will be in the `dist/` directory.

## 🚨 Troubleshooting

### Common Issues

**Backend won't start:**
- ✅ Check Python version: `python --version`
- ✅ Verify FFmpeg installation: `ffmpeg -version`
- ✅ Confirm virtual environment is activated
- ✅ Check if port 8000 is available

**Frontend connection errors:**
- ✅ Ensure backend is running on port 8000
- ✅ Check browser console for CORS errors
- ✅ Verify API endpoints in component files

**API Key issues:**
- ✅ Confirm `.env` file exists in backend directory
- ✅ Check API key format and validity
- ✅ Restart backend after changing environment variables

**Audio processing errors:**
- ✅ Verify FFmpeg is properly installed
- ✅ Check audio file format and size limits
- ✅ Ensure sufficient system memory

### File Size Limits

- **Images**: 10MB maximum
- **Audio**: 100MB maximum
- **Processing time**: Up to 3 minutes for complex audio

### Performance Tips

- **Images**: Use compressed formats (JPEG) for faster processing
- **Audio**: WAV format provides best diarization results
- **Large files**: Consider splitting long audio into segments

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature-name`
3. **Commit** your changes: `git commit -am 'Add feature'`
4. **Push** to the branch: `git push origin feature-name`
5. **Submit** a pull request

### Development Guidelines

- Follow TypeScript best practices for frontend
- Use type hints and docstrings for Python backend
- Add tests for new features
- Update documentation for API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:

1. **Check** the troubleshooting section above
2. **Review** API documentation at http://localhost:8000/docs
3. **Examine** backend logs in your terminal
4. **Open** an issue on GitHub with:
   - Operating system and versions
   - Error messages and logs
   - Steps to reproduce the problem

## 🙏 Acknowledgments

- **OpenAI Whisper** for speech recognition
- **Google Gemini** for advanced AI processing
- **FastAPI** for the robust backend framework
- **React + Vite** for the modern frontend experience

---

**Happy Processing! 🎉**
