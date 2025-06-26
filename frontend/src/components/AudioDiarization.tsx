import React, { useState, useRef, type JSX } from "react";
import axios, { AxiosError } from "axios";

interface DiarizationResult {
  speakers?: Array<{
    speaker: string;
    text: string;
    start_time?: string;
    end_time?: string;
  }>;
  summary?: string;
  speaker_count?: number;
  error?: string;
}

interface ErrorResponse {
  detail?: string;
}

export default function AudioDiarization(): JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<DiarizationResult | null>(null);
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

      // Check file size (100MB limit)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (selectedFile.size > maxSize) {
        setError("File size must be less than 100MB");
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
      const res = await axios.post<DiarizationResult>(
        "https://riu-rd-contact-center-operations.hf.space/audio/diarization",
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 180000, // 3 minute timeout for diarization processing
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

  const getSpeakerColor = (speaker: string): string => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
    ];
    const index = parseInt(speaker.replace(/\D/g, "")) || 0;
    return colors[index % colors.length];
  };

  return (
    <div style={{ marginBottom: "30px" }}>
      <h3 style={{ color: "#B11116", marginBottom: "20px" }}>
        Speaker Diarization
      </h3>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="diarization-audio-input"
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
            id="diarization-audio-input"
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

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "14px",
                color: "#666",
              }}
            >
              <span>
                <strong>File:</strong> {file?.name}
              </span>
              <span>
                <strong>Size:</strong>{" "}
                {file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : ""}
              </span>
            </div>
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
              Processing Diarization...
            </span>
          ) : (
            <span>
              <span style={{ marginRight: "8px" }}>👥</span>
              Analyze Speakers
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
            Speaker Diarization Results
          </h4>

          {/* Summary Section */}
          {result.speaker_count && (
            <div
              style={{
                marginBottom: "15px",
                padding: "15px",
                backgroundColor: "#e3f2fd",
                border: "1px solid #bbdefb",
                borderRadius: "8px",
              }}
            >
              <h5 style={{ color: "#1565c0", marginBottom: "10px" }}>
                Summary
              </h5>
              <p style={{ margin: "0 0 10px 0" }}>
                <strong>Number of speakers detected:</strong>{" "}
                {result.speaker_count}
              </p>
              {result.summary && (
                <p style={{ margin: 0, lineHeight: "1.5" }}>{result.summary}</p>
              )}
            </div>
          )}

          {/* Speaker Segments */}
          {result.speakers && result.speakers.length > 0 && (
            <div
              style={{
                marginBottom: "15px",
                padding: "15px",
                backgroundColor: "#f8f9fa",
                border: "1px solid #dee2e6",
                borderRadius: "8px",
              }}
            >
              <h5 style={{ color: "#333", marginBottom: "15px" }}>
                Speaker Segments:
              </h5>
              <div style={{ maxHeight: "400px", overflow: "auto" }}>
                {result.speakers.map((segment, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: "10px",
                      padding: "12px",
                      backgroundColor: "white",
                      border: `2px solid ${getSpeakerColor(segment.speaker)}`,
                      borderRadius: "8px",
                      borderLeft: `6px solid ${getSpeakerColor(
                        segment.speaker
                      )}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: "bold",
                          color: getSpeakerColor(segment.speaker),
                          fontSize: "14px",
                        }}
                      >
                        {segment.speaker}
                      </span>
                      {(segment.start_time || segment.end_time) && (
                        <span style={{ fontSize: "12px", color: "#666" }}>
                          {segment.start_time && segment.end_time
                            ? `${segment.start_time} - ${segment.end_time}`
                            : segment.start_time || segment.end_time}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        lineHeight: "1.5",
                        fontSize: "14px",
                      }}
                    >
                      {segment.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw JSON */}
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
        <strong>Supported formats:</strong> WAV, MP3, MP4, M4A (best results
        with WAV)
        <br />
        <strong>Max file size:</strong> 100MB
        <br />
        <strong>Features:</strong> Speaker identification and conversation
        analysis
        <br />
        <strong>Processing time:</strong> May take 1-3 minutes depending on
        audio length
      </div>
    </div>
  );
}
