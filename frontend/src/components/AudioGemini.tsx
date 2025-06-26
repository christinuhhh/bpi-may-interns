import React, { useState, useRef, type JSX } from "react";
import axios, { AxiosError } from "axios";

interface GeminiResult {
  transcription?: string;
  translation?: string;
  error?: string;
}

interface ErrorResponse {
  detail?: string;
}

export default function AudioGemini(): JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<GeminiResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file type
      if (!selectedFile.type.startsWith("audio/")) {
        setError("Please select a valid audio file (WAV, MP3, etc.)");
        return;
      }

      setFile(selectedFile);
      setError("");
      setResult(null);

      // Create audio URL for playback
      const url = URL.createObjectURL(selectedFile);
      setAudioUrl(url);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    if (!file) {
      setError("Please select an audio file first.");
      return;
    }

    setError("");
    setLoading(true);

    const form = new FormData();
    form.append("audio", file);

    try {
      const res = await axios.post<GeminiResult>(
        "https://riu-rd-contact-center-operations.hf.space/audio/gemini",
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000, // 2 minute timeout for audio processing
        }
      );
      setResult(res.data);
    } catch (err) {
      console.error("Upload error:", err);
      const axiosError = err as AxiosError<ErrorResponse>;

      if (axiosError.response) {
        setError(
          `Server error: ${
            axiosError.response.data?.detail || axiosError.response.statusText
          }`
        );
      } else if (axiosError.request) {
        setError(
          "Network error: Unable to connect to server. Please check if the backend is running."
        );
      } else {
        setError("Upload failed: " + axiosError.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div style={{ marginBottom: "30px" }}>
      <h3 style={{ color: "#B11116", marginBottom: "20px" }}>
        Gemini Audio Processing
      </h3>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="gemini-audio-input"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
              color: "#333",
            }}
          >
            Select Audio File:
          </label>
          <input
            id="gemini-audio-input"
            type="file"
            accept="audio/*"
            onChange={handleFileChange}
            style={{
              width: "100%",
              padding: "10px",
              border: "2px solid #dee2e6",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />
        </div>

        {/* Audio Player */}
        {audioUrl && (
          <div
            style={{
              marginBottom: "20px",
              padding: "15px",
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              backgroundColor: "#f8f9fa",
            }}
          >
            <h4 style={{ margin: "0 0 15px 0", color: "#333" }}>
              Audio Preview
            </h4>

            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              style={{ display: "none" }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                marginBottom: "10px",
              }}
            >
              <button
                type="button"
                onClick={togglePlayPause}
                style={{
                  backgroundColor: "#B11116",
                  color: "white",
                  border: "none",
                  padding: "10px 15px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "16px",
                  width: "45px",
                  height: "45px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isPlaying ? "⏸️" : "▶️"}
              </button>

              <div style={{ flex: 1 }}>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  style={{
                    width: "100%",
                    height: "8px",
                    background: "#ddd",
                    outline: "none",
                    borderRadius: "4px",
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    color: "#666",
                    marginTop: "5px",
                  }}
                >
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
              <strong>File:</strong> {file?.name}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !file}
          style={{
            backgroundColor: loading || !file ? "#ccc" : "#B11116",
            color: "white",
            border: "none",
            padding: "12px 30px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loading || !file ? "not-allowed" : "pointer",
            transition: "background-color 0.3s ease",
            width: "100%",
            maxWidth: "300px",
          }}
        >
          {loading ? (
            <span>
              <span style={{ marginRight: "8px" }}>⏳</span>
              Processing Audio...
            </span>
          ) : (
            <span>
              <span style={{ marginRight: "8px" }}>🤖</span>
              Process with Gemini
            </span>
          )}
        </button>
      </form>

      {error && (
        <div
          style={{
            color: "#721c24",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "8px",
            padding: "15px",
            marginTop: "15px",
            fontSize: "14px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div style={{ marginTop: "20px" }}>
          <h4 style={{ color: "#B11116", marginBottom: "15px" }}>
            Gemini Results
          </h4>

          {result.transcription && (
            <div
              style={{
                marginBottom: "15px",
                padding: "15px",
                backgroundColor: "#f8f9fa",
                border: "1px solid #dee2e6",
                borderRadius: "8px",
              }}
            >
              <h5 style={{ color: "#333", marginBottom: "10px" }}>
                Transcription:
              </h5>
              <p style={{ margin: 0, lineHeight: "1.5" }}>
                {result.transcription}
              </p>
            </div>
          )}

          {result.translation && (
            <div
              style={{
                marginBottom: "15px",
                padding: "15px",
                backgroundColor: "#f8f9fa",
                border: "1px solid #dee2e6",
                borderRadius: "8px",
              }}
            >
              <h5 style={{ color: "#333", marginBottom: "10px" }}>
                Translation:
              </h5>
              <p style={{ margin: 0, lineHeight: "1.5" }}>
                {result.translation}
              </p>
            </div>
          )}

          <div
            style={{
              padding: "15px",
              backgroundColor: "#f8f9fa",
              border: "1px solid #dee2e6",
              borderRadius: "8px",
            }}
          >
            <h5 style={{ color: "#333", marginBottom: "10px" }}>
              Raw JSON Response:
            </h5>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                fontFamily: "monospace",
                fontSize: "12px",
                lineHeight: "1.4",
                backgroundColor: "white",
                padding: "10px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                maxHeight: "200px",
                overflow: "auto",
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </div>
      )}

      <div
        style={{
          backgroundColor: "#e7f3ff",
          border: "1px solid #b3d9ff",
          borderRadius: "8px",
          padding: "15px",
          marginTop: "20px",
          fontSize: "14px",
          color: "#004085",
        }}
      >
        <strong>Supported formats:</strong> WAV, MP3, MP4, M4A, FLAC
        <br />
        <strong>Max file size:</strong> 100MB
        <br />
        <strong>Features:</strong> Transcription and translation using Google
        Gemini 2.5 Pro
      </div>
    </div>
  );
}
