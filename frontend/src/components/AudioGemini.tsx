import React, { useState, useRef, type JSX } from "react";
import axios, { AxiosError } from "axios";

// Updated interface to match backend response with insights
interface GeminiResult {
  transcription?: string;
  translation?: string;
  insights?: {
    case_transaction_type?: string;
    case_priority_level?: any; // Can be string or object
    case_type?: string;
    sentiment?: any; // Can be string or object
    summary?: string;
    keywords?: string;
    dialogue_history?: any; // Can be string or object
  };
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
      // const res = await axios.post<GeminiResult>(
      //   "https://riu-rd-contact-center-operations.hf.space/audio/gemini",
      const res = await axios.post<GeminiResult>(
            "http://localhost:8000/audio/whisper",
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120000, // 2 minute timeout for audio processing
        }
      );
      // Process the result to parse stringified JSON in insights
      const processedResult: GeminiResult = { ...res.data };
      if (processedResult.insights) {
        if (typeof processedResult.insights.case_priority_level === 'string') {
          processedResult.insights.case_priority_level = parseJsonSafely(processedResult.insights.case_priority_level);
        }
        if (typeof processedResult.insights.sentiment === 'string') {
          processedResult.insights.sentiment = parseJsonSafely(processedResult.insights.sentiment);
        }
        if (typeof processedResult.insights.dialogue_history === 'string') {
          processedResult.insights.dialogue_history = parseJsonSafely(processedResult.insights.dialogue_history);
        }
      }
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

  // Helper function to safely parse JSON strings
  const parseJsonSafely = (value: any) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value; // Return original value if parsing fails
      }
    }
    return value; // Return original value if not a string
  };

  // Helper functions for styling
  const getSentimentColor = (sentiment: string): string => {
    switch (sentiment.toLowerCase()) {
      case "positive":
        return "#28a745";
      case "negative":
        return "#dc3545";
      case "neutral":
        return "#6c757d";
      default:
        return "#007bff";
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case "urgent":
      case "high":
        return "#dc3545";
      case "medium":
        return "#fd7e14";
      case "low":
        return "#28a745";
      default:
        return "#6c757d";
    }
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
    return speaker.toLowerCase() === "customer" ? colors[0] : colors[1];
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


          {/* Updated Insights Section with Card Layout */}
          {result.insights && (
            <div
              style={{
                marginBottom: "15px",
                padding: "15px",
                backgroundColor: "#f0f8ff",
                border: "1px solid #b3d9ff",
                borderRadius: "8px",
              }}
            >
              <h5 style={{ color: "#333", marginBottom: "15px" }}>
                Text Analysis Insights:
              </h5>

              {/* Key Insights Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "15px",
                  marginBottom: "20px",
                }}
              >
                {/* Case Type */}
                {result.insights.case_type && (
                  <div
                    style={{
                      padding: "15px",
                      backgroundColor: "#e3f2fd",
                      border: "1px solid #bbdefb",
                      borderRadius: "8px",
                    }}
                  >
                    <h6 style={{ color: "#1565c0", marginBottom: "8px", fontSize: "14px" }}>
                      Case Type
                    </h6>
                    <p style={{ margin: 0, fontWeight: "bold", fontSize: "16px" }}>
                      {result.insights.case_type}
                    </p>
                  </div>
                )}

                {/* Transaction Type */}
                {result.insights.case_transaction_type && (
                  <div
                    style={{
                      padding: "15px",
                      backgroundColor: "#f3e5f5",
                      border: "1px solid #ce93d8",
                      borderRadius: "8px",
                    }}
                  >
                    <h6 style={{ color: "#7b1fa2", marginBottom: "8px", fontSize: "14px" }}>
                      Transaction Type
                    </h6>
                    <p style={{ margin: 0, fontWeight: "bold", fontSize: "16px" }}>
                      {result.insights.case_transaction_type}
                    </p>
                  </div>
                )}

                {/* Priority Level */}
                {result.insights.case_priority_level && (
                  <div
                    style={{
                      padding: "15px",
                      backgroundColor: "#fff3e0",
                      border: "1px solid #ffcc02",
                      borderRadius: "8px",
                    }}
                  >
                    <h6 style={{ color: "#f57c00", marginBottom: "8px", fontSize: "14px" }}>
                      Priority Level
                    </h6>
                    {typeof result.insights.case_priority_level === 'object' && 
                     result.insights.case_priority_level.priority_category ? (
                      <>
                        <p
                          style={{
                            margin: "0 0 5px 0",
                            fontWeight: "bold",
                            fontSize: "16px",
                            color: getPriorityColor(result.insights.case_priority_level.priority_category),
                          }}
                        >
                          {result.insights.case_priority_level.priority_category}
                        </p>
                        <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
                          {result.insights.case_priority_level.priority_reason}
                        </p>
                      </>
                    ) : (
                      <p style={{ margin: 0, fontWeight: "bold", fontSize: "16px" }}>
                        {typeof result.insights.case_priority_level === 'string' 
                          ? result.insights.case_priority_level 
                          : JSON.stringify(result.insights.case_priority_level)}
                      </p>
                    )}
                  </div>
                )}

                {/* Sentiment */}
                {result.insights.sentiment && (
                  <div
                    style={{
                      padding: "15px",
                      backgroundColor: "#e8f5e8",
                      border: "1px solid #c8e6c9",
                      borderRadius: "8px",
                    }}
                  >
                    <h6 style={{ color: "#2e7d32", marginBottom: "8px", fontSize: "14px" }}>
                      Sentiment
                    </h6>
                    {typeof result.insights.sentiment === 'object' && 
                     result.insights.sentiment.sentiment_category ? (
                      <>
                        <p
                          style={{
                            margin: "0 0 5px 0",
                            fontWeight: "bold",
                            fontSize: "16px",
                            color: getSentimentColor(result.insights.sentiment.sentiment_category),
                          }}
                        >
                          {result.insights.sentiment.sentiment_category}
                        </p>
                        <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
                          {result.insights.sentiment.sentiment_reasoning}
                        </p>
                      </>
                    ) : (
                      <p style={{ margin: 0, fontWeight: "bold", fontSize: "16px" }}>
                        {typeof result.insights.sentiment === 'string' 
                          ? result.insights.sentiment 
                          : JSON.stringify(result.insights.sentiment)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Summary */}
              {result.insights.summary && (
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "15px",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #dee2e6",
                    borderRadius: "8px",
                  }}
                >
                  <h5 style={{ color: "#333", marginBottom: "10px" }}>Summary</h5>
                  <p style={{ margin: 0, lineHeight: "1.6" }}>{result.insights.summary}</p>
                </div>
              )}

              {/* Keywords */}
              {result.insights.keywords && (
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "15px",
                    backgroundColor: "#fff8e1",
                    border: "1px solid #ffecb3",
                    borderRadius: "8px",
                  }}
                >
                  <h5 style={{ color: "#f57c00", marginBottom: "10px" }}>Keywords</h5>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {result.insights.keywords.split(",").map((keyword, index) => (
                      <span
                        key={index}
                        style={{
                          backgroundColor: "#ff9800",
                          color: "white",
                          padding: "4px 12px",
                          borderRadius: "16px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        {keyword.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sentiment Distribution */}
              {result.insights.sentiment && 
               typeof result.insights.sentiment === 'object' && 
               result.insights.sentiment.sentiment_distribution && (
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "15px",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #dee2e6",
                    borderRadius: "8px",
                  }}
                >
                  <h5 style={{ color: "#333", marginBottom: "15px" }}>
                    Sentiment Distribution
                  </h5>
                  {result.insights.sentiment.sentiment_distribution.map((item: any, index: number) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: "10px",
                        padding: "10px",
                        backgroundColor: "white",
                        border: "1px solid #dee2e6",
                        borderRadius: "6px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "5px",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "bold",
                            color: getSentimentColor(item.sentiment_tag),
                          }}
                        >
                          {item.sentiment_tag}
                        </span>
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: getSentimentColor(item.sentiment_tag),
                          }}
                        >
                          {(item.sentiment_confidence_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "6px",
                          backgroundColor: "#e9ecef",
                          borderRadius: "3px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${item.sentiment_confidence_score * 100}%`,
                            height: "100%",
                            backgroundColor: getSentimentColor(item.sentiment_tag),
                            borderRadius: "3px",
                          }}
                        />
                      </div>
                      {item.emotional_indicators && 
                       item.emotional_indicators.length > 0 && 
                       item.emotional_indicators[0] !== "blank" && (
                        <div style={{ marginTop: "8px" }}>
                          <span style={{ fontSize: "12px", color: "#666" }}>
                            Indicators: {item.emotional_indicators.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Dialogue History */}
              {result.insights.dialogue_history && 
               typeof result.insights.dialogue_history === 'object' && 
               result.insights.dialogue_history.dialogue_history && (
                <div
                  style={{
                    marginBottom: "20px",
                    padding: "15px",
                    backgroundColor: "#f8f9fa",
                    border: "1px solid #dee2e6",
                    borderRadius: "8px",
                  }}
                >
                  <h5 style={{ color: "#333", marginBottom: "15px" }}>
                    Dialogue History
                  </h5>
                  <div style={{ maxHeight: "300px", overflow: "auto" }}>
                    {result.insights.dialogue_history.dialogue_history.map((turn: any, index: number) => (
                      <div
                        key={index}
                        style={{
                          marginBottom: "10px",
                          padding: "12px",
                          backgroundColor: "white",
                          border: `2px solid ${getSpeakerColor(turn.speaker)}`,
                          borderRadius: "8px",
                          borderLeft: `6px solid ${getSpeakerColor(turn.speaker)}`,
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
                              color: getSpeakerColor(turn.speaker),
                              fontSize: "14px",
                            }}
                          >
                            {turn.speaker}
                          </span>
                          <span style={{ fontSize: "12px", color: "#666" }}>
                            Turn {turn.turn_id}
                          </span>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            lineHeight: "1.5",
                            fontSize: "14px",
                          }}
                        >
                          {turn.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
        <strong>Features:</strong> Transcription, translation, and AI-powered text analysis using Google Gemini 2.5 Pro
      </div>
    </div>
  );
}