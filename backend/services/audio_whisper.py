import whisper
import torch
import tempfile
import os
from typing import Dict

# Determine the most efficient device available (CUDA if possible, otherwise CPU)
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# Load the Whisper model once when the module is imported.
# This is a time and resource-intensive operation, so it should not be done on every API call.
try:
    print(f"Loading Whisper model 'large' onto device '{DEVICE}'...")
    model = whisper.load_model("large", device=DEVICE)
    print("Whisper model loaded successfully.")
except Exception as e:
    print(f"Fatal: Error loading Whisper model: {e}")
    model = None

def process_audio_with_whisper(audio_bytes: bytes) -> Dict[str, str]:
    """
    Transcribes and translates a given audio file's bytes using the Whisper model.

    This function saves the audio bytes to a temporary file and passes the file
    path to Whisper for processing. This is a robust way to handle file access
    and prevent permission errors with ffmpeg, especially on Windows.

    Args:
        audio_bytes: The raw bytes of the audio file (e.g., WAV, MP3).

    Returns:
        A dictionary containing the Tagalog transcription and English translation.
        Example: {"transcription": "...", "translation": "..."}

    Raises:
        ValueError: If the Whisper model was not loaded successfully.
        Exception: If audio processing or model inference fails.
    """
    if model is None:
        raise ValueError("Whisper model is not available or failed to load.")

    # Create a temporary file to store the audio.
    # Using delete=False is crucial on Windows to allow other processes to open the file by its path.
    # We will manually delete the file in the 'finally' block.
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".tmp") as temp_audio_file:
            temp_path = temp_audio_file.name
            # Write the uploaded audio bytes to the temporary file
            temp_audio_file.write(audio_bytes)
            # The file is automatically closed when exiting the 'with' block
    except Exception as e:
        print(f"Error creating temporary file: {e}")
        raise

    try:
        # Perform transcription using the file path
        transcription_result = model.transcribe(
            temp_path,
            language="tl",
            task="transcribe"
        )

        # Perform translation using the same file path
        translation_result = model.transcribe(
            temp_path,
            language="tl",
            task="translate"
        )

        return {
            "transcription": transcription_result.get('text', '').strip(), # type: ignore
            "translation": translation_result.get('text', '').strip() # type: ignore
        }
    except Exception as e:
        # Log and re-raise any exceptions to be handled by the FastAPI endpoint
        print(f"An error occurred during Whisper processing: {e}")
        raise
    finally:
        # Ensure the temporary file is deleted after processing
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)