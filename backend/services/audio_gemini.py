import os
from typing import Dict

import google.genai as genai
from dotenv import load_dotenv
from google.genai.types import Part

# Load environment variables from a .env file in the root directory
load_dotenv()

# --- Configuration ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# As per the notebook.ipynb, using the specified model name.
MODEL_ID = "gemini-2.5-pro"

# --- Client Initialization ---
if not GEMINI_API_KEY:
    raise ValueError(
        "GEMINI_API_KEY not found in environment variables. "
        "Please create a .env file in the project root and set the key."
    )

# Configure the genai client with the API key
client = genai.Client(api_key=GEMINI_API_KEY)

def _transcribe_audio(audio_bytes: bytes) -> str:
    """
    Sends base64-encoded WAV audio to the model and returns the transcription as plain text.
    """
    audio_part = Part.from_bytes(data=audio_bytes, mime_type="audio/wav")
    text_part = (
            "You are a world-class transcription engine. "
            "Transcribe the following audio to plain text only, with no extra formatting:\n\n"
            "(Begin audio input)"
    )

    resp = client.models.generate_content(
        model=MODEL_ID,
        contents=[audio_part, 
                  text_part
        ]
    )
    return resp.text.strip() # type: ignore


def _translate_to_english(text: str) -> str:
    """
    Detects the language of the input and translates it into English.
    """
    prompt = (
        "You are a world-class translation engine. "
        "Detect the language of the following text and translate it into English. "
        "Return ONLY the translated English text with no extra commentary:\n\n"
        f"{text}"
    )
    resp = client.models.generate_content(
        model=MODEL_ID,
        contents=prompt
    )
    return resp.text.strip() # type: ignore


def process_audio_with_gemini(audio_bytes: bytes) -> Dict[str, str]:
    """
    Processes an audio file by first transcribing it and then translating the
    resulting text to English using the Gemini model.

    This function orchestrates the transcription and translation calls.

    Args:
        audio_bytes: The byte content of the audio file.
        mime_type: The MIME type of the audio file (e.g., 'audio/wav', 'audio/mp3').

    Returns:
        A dictionary containing the 'transcription' and 'translation'.

    Raises:
        Exception: If there is an error during the API calls to the Gemini model.
    """
    try:
        # Step 1: Transcribe the audio using the internal helper function
        transcription = _transcribe_audio(audio_bytes)

        # Step 2: Translate the transcription to English if it's not empty
        translation = ""
        if transcription:
            translation = _translate_to_english(transcription)

        return {"transcription": transcription, "translation": translation}
    except Exception as e:
        # Re-raise the exception with more context to be caught by the API endpoint
        raise Exception(f"Error processing audio with Gemini: {str(e)}")