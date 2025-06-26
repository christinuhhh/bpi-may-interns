import json
import base64
import os
from typing import Dict, List, Any, Tuple
from pydub import AudioSegment
import io

from google import genai
from google.genai import types


class AudioDiarizationError(Exception):
    """Custom exception for audio diarization errors"""
    pass


def get_gemini_client() -> genai.Client:
    """
    Initialize and return a Google Gemini API client.
    
    Returns:
        genai.Client: Authenticated Gemini client
        
    Raises:
        AudioDiarizationError: If API key is not found or client initialization fails
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise AudioDiarizationError("GEMINI_API_KEY environment variable not found")
    
    try:
        client = genai.Client(api_key=api_key)
        return client
    except Exception as e:
        raise AudioDiarizationError(f"Failed to initialize Gemini client: {str(e)}")


def get_audio_duration(audio_bytes: bytes) -> float:
    """
    Get the duration of audio in seconds.
    
    Args:
        audio_bytes: Raw audio file bytes
        
    Returns:
        float: Duration in seconds
        
    Raises:
        AudioDiarizationError: If audio processing fails
    """
    try:
        # Create AudioSegment from bytes
        audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
        duration_sec = len(audio) / 1000.0
        return duration_sec
    except Exception as e:
        raise AudioDiarizationError(f"Failed to process audio duration: {str(e)}")


def detect_audio_format(audio_bytes: bytes) -> str:
    """
    Detect audio format from bytes.
    
    Args:
        audio_bytes: Raw audio file bytes
        
    Returns:
        str: Audio format (e.g., 'wav', 'mp3', 'mp4')
        
    Raises:
        AudioDiarizationError: If format detection fails
    """
    try:
        # Try to create AudioSegment to detect format
        audio = AudioSegment.from_file(io.BytesIO(audio_bytes))
        
        # Check file signature/magic bytes for common formats
        if audio_bytes.startswith(b'RIFF') and b'WAVE' in audio_bytes[:12]:
            return 'wav'
        elif audio_bytes.startswith(b'ID3') or audio_bytes.startswith(b'\xff\xfb'):
            return 'mp3'
        elif audio_bytes.startswith(b'\x00\x00\x00\x20ftypM4A'):
            return 'm4a'
        elif audio_bytes.startswith(b'\x00\x00\x00\x18ftyp') or audio_bytes.startswith(b'\x00\x00\x00\x20ftyp'):
            return 'mp4'
        else:
            # Default to wav if we can't detect
            return 'wav'
    except Exception as e:
        raise AudioDiarizationError(f"Failed to detect audio format: {str(e)}")


def create_diarization_request(audio_bytes: bytes, audio_format: str, model: str = "gemini-2.5-pro") -> Dict[str, Any]:
    """
    Create a diarization request for the Gemini API.
    
    Args:
        audio_bytes: Raw audio file bytes
        audio_format: Audio file format (e.g., 'wav', 'mp3')
        model: Gemini model to use
        
    Returns:
        Dict containing the API request configuration
        
    Raises:
        AudioDiarizationError: If request creation fails
    """
    try:
        # Encode audio to base64
        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
        
        # Prepare request parts
        audio_part = {
            "inlineData": {
                "mimeType": f"audio/{audio_format}",
                "data": audio_b64
            }
        }
        
        text_part = {
            "text": (
                "You are a speaker-diarization engine. "
                "For the audio input, return a JSON object with a top-level `segments` array. "
                "Each segment must have: `speaker` (string) and `text` (transcript)."
            )
        }
        
        # Define JSON schema for structured response
        schema = {
            "type": "object",
            "properties": {
                "segments": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "speaker": {"type": "string"},
                            "text": {"type": "string"}
                        },
                        "required": ["speaker", "text"]
                    }
                }
            },
            "required": ["segments"]
        }
        
        # Build configuration for JSON mode
        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema
        )
        
        # Build complete request
        request_kwargs = {
            "model": model,
            "contents": [audio_part, text_part],
            "config": config
        }
        
        return request_kwargs
        
    except Exception as e:
        raise AudioDiarizationError(f"Failed to create diarization request: {str(e)}")


def parse_diarization_response(response_text: str) -> Tuple[List[Dict[str, str]], Dict[str, Any]]:
    """
    Parse the Gemini API response for diarization results.
    
    Args:
        response_text: Raw JSON response text from Gemini
        
    Returns:
        Tuple of (segments_list, raw_json_dict)
        
    Raises:
        AudioDiarizationError: If JSON parsing fails
    """
    try:
        raw_json = json.loads(response_text)
        segments = raw_json.get("segments", [])
        
        # Validate segments structure
        if not isinstance(segments, list):
            raise AudioDiarizationError("Response segments must be a list")
        
        for i, segment in enumerate(segments):
            if not isinstance(segment, dict):
                raise AudioDiarizationError(f"Segment {i} must be a dictionary")
            if "speaker" not in segment or "text" not in segment:
                raise AudioDiarizationError(f"Segment {i} missing required fields 'speaker' or 'text'")
        
        return segments, raw_json
        
    except json.JSONDecodeError as e:
        raise AudioDiarizationError(f"Failed to parse JSON from Gemini response: {str(e)}")
    except Exception as e:
        raise AudioDiarizationError(f"Failed to process diarization response: {str(e)}")


def calculate_diarization_stats(segments: List[Dict[str, str]], duration_sec: float) -> Dict[str, Any]:
    """
    Calculate statistics from diarization results.
    
    Args:
        segments: List of speaker segments
        duration_sec: Audio duration in seconds
        
    Returns:
        Dict containing diarization statistics
    """
    total_turns = len(segments)
    speakers = set(segment["speaker"] for segment in segments)
    num_speakers = len(speakers)
    
    # Format duration as MM:SS
    duration_str = f"{int(duration_sec//60):02d}:{int(duration_sec%60):02d}"
    
    return {
        "total_turns": total_turns,
        "num_speakers": num_speakers,
        "duration_seconds": duration_sec,
        "duration_formatted": duration_str,
        "speakers": sorted(list(speakers))
    }


def process_audio_diarization(audio_bytes: bytes, filename: str = None) -> Dict[str, Any]: # type: ignore
    """
    Process audio file for speaker diarization using Gemini 2.5 Pro.
    
    This function takes raw audio bytes and returns a structured JSON response
    containing speaker diarization results with segments, statistics, and metadata.
    
    Args:
        audio_bytes: Raw audio file bytes
        filename: Optional filename for metadata
        
    Returns:
        Dict containing:
            - segments: List of speaker segments with speaker and text
            - statistics: Diarization statistics (speakers, turns, duration)
            - metadata: Processing metadata
            - raw_response: Original Gemini response
            
    Raises:
        AudioDiarizationError: If any step of the diarization process fails
    """
    try:
        # Initialize Gemini client
        client = get_gemini_client()
        
        # Get audio duration and format
        duration_sec = get_audio_duration(audio_bytes)
        audio_format = detect_audio_format(audio_bytes)
        
        # Create API request
        request_kwargs = create_diarization_request(audio_bytes, audio_format)
        
        # Make API call to Gemini
        try:
            response = client.models.generate_content(**request_kwargs)
            response_text = response.text
        except Exception as e:
            raise AudioDiarizationError(f"Gemini API call failed: {str(e)}")
        
        # Parse response
        segments, raw_json = parse_diarization_response(response_text) # type: ignore
        
        # Calculate statistics
        stats = calculate_diarization_stats(segments, duration_sec)
        
        # Build final response
        result = {
            "segments": segments,
            "statistics": stats,
            "metadata": {
                "filename": filename,
                "audio_format": audio_format,
                "model_used": "gemini-2.5-pro",
                "processing_status": "success"
            },
            "raw_response": raw_json
        }
        
        return result
        
    except AudioDiarizationError:
        # Re-raise our custom errors
        raise
    except Exception as e:
        # Catch any unexpected errors
        raise AudioDiarizationError(f"Unexpected error during audio diarization: {str(e)}")


# Example usage and testing function
def test_diarization_service():
    """
    Test function for the diarization service.
    This is mainly for development and debugging purposes.
    """
    try:
        # This would require an actual audio file to test
        print("Audio diarization service loaded successfully")
        print("Available functions:")
        print("- process_audio_diarization(audio_bytes, filename)")
        print("- get_gemini_client()")
        print("- get_audio_duration(audio_bytes)")
        print("- detect_audio_format(audio_bytes)")
        
        # Check if API key is available
        api_key = os.getenv("GEMINI_API_KEY")
        if api_key:
            print("✓ GEMINI_API_KEY found in environment")
        else:
            print("✗ GEMINI_API_KEY not found in environment")
            
    except Exception as e:
        print(f"Service test failed: {e}")


if __name__ == "__main__":
    test_diarization_service()