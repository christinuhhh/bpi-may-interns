import React, { useState, type JSX } from "react";
import axios, { AxiosError } from "axios";

// Main result interface matching your FastAPI output
interface TextInsightResult {
  case_transaction_type: string;
  case_priority_level: string;    // JSON string that needs parsing
  case_type: string;
  sentiment: string;              // JSON string that needs parsing
  summary: string;
  keywords: string;
  dialogue_history: string;       // JSON string that needs parsing
  error?: string;                 // For error handling
}

// Parsed interfaces for the JSON strings
interface PriorityLevel {
  priority_category: string;
  priority_reason: string;
}

interface SentimentDistribution {
  sentiment_tag: string;
  sentiment_confidence_score: number;
  emotional_indicators: string[];
}

interface SentimentAnalysis {
  sentiment_category: string;
  sentiment_reasoning: string;
  sentiment_distribution: SentimentDistribution[];
}

interface DialogueTurn {
  turn_id: number;
  speaker: string;
  text: string;
}

interface DialogueHistory {
  dialogue_history: DialogueTurn[];
}

interface ErrorResponse {
  detail?: string;
}

export default function TextInsights(): JSX.Element {
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<TextInsightResult | null>(null);
  const [parsedResult, setParsedResult] = useState<{
    priority: PriorityLevel | null;
    sentiment: SentimentAnalysis | null;
    dialogue: DialogueHistory | null;
  }>({ priority: null, sentiment: null, dialogue: null });

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setText(e.target.value);
    setError("");
    setResult(null);
    setParsedResult({ priority: null, sentiment: null, dialogue: null });
  };

  const parseJsonFields = (result: TextInsightResult) => {
    try {
      const priority = JSON.parse(result.case_priority_level) as PriorityLevel;
      const sentiment = JSON.parse(result.sentiment) as SentimentAnalysis;
      const dialogue = JSON.parse(result.dialogue_history) as DialogueHistory;
      
      setParsedResult({ priority, sentiment, dialogue });
    } catch (err) {
      console.error("Error parsing JSON fields:", err);
      setParsedResult({ priority: null, sentiment: null, dialogue: null });
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    if (!text.trim()) {
      setError("Please enter some text to analyze.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await axios.post<TextInsightResult>(
        "http://localhost:8000/text",
        { text: text.trim() },
        {
          headers: { "Content-Type": "application/json" },
          timeout: 60000, // 1 minute timeout
        }
      );
      setResult(res.data);
      parseJsonFields(res.data);
    } catch (err) {
      console.error("Analysis error:", err);
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
        setError("Analysis failed: " + axiosError.message);
      }
    } finally {
      setLoading(false);
    }
  };

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
        Text Insights Analysis
      </h3>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="text-input"
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "bold",
              color: "#333",
            }}
          >
            Enter Text for Analysis:
          </label>
          <textarea
            id="text-input"
            value={text}
            onChange={handleTextChange}
            placeholder="Enter customer conversation text, support tickets, or any text you want to analyze..."
            style={{
              width: "100%",
              minHeight: "150px",
              padding: "15px",
              border: "2px solid #dee2e6",
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "Arial, sans-serif",
              lineHeight: "1.5",
              resize: "vertical",
            }}
          />
          <div
            style={{
              fontSize: "12px",
              color: "#666",
              marginTop: "5px",
              textAlign: "right",
            }}
          >
            {text.length} characters
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !text.trim()}
          style={{
            backgroundColor: loading || !text.trim() ? "#ccc" : "#B11116",
            color: "white",
            border: "none",
            padding: "12px 30px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: loading || !text.trim() ? "not-allowed" : "pointer",
            transition: "background-color 0.3s ease",
            width: "100%",
            maxWidth: "300px",
          }}
        >
          {loading ? (
            <span>
              <span style={{ marginRight: "8px" }}>⏳</span>
              Analyzing Text...
            </span>
          ) : (
            <span>
              <span style={{ marginRight: "8px" }}>🔍</span>
              Analyze Text
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
            Text Analysis Results
          </h4>

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
                {result.case_type}
              </p>
            </div>

            {/* Transaction Type */}
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
                {result.case_transaction_type}
              </p>
            </div>

            {/* Priority Level */}
            {parsedResult.priority && (
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
                <p
                  style={{
                    margin: "0 0 5px 0",
                    fontWeight: "bold",
                    fontSize: "16px",
                    color: getPriorityColor(parsedResult.priority.priority_category),
                  }}
                >
                  {parsedResult.priority.priority_category}
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
                  {parsedResult.priority.priority_reason}
                </p>
              </div>
            )}

            {/* Sentiment */}
            {parsedResult.sentiment && (
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
                <p
                  style={{
                    margin: "0 0 5px 0",
                    fontWeight: "bold",
                    fontSize: "16px",
                    color: getSentimentColor(parsedResult.sentiment.sentiment_category),
                  }}
                >
                  {parsedResult.sentiment.sentiment_category}
                </p>
                <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>
                  {parsedResult.sentiment.sentiment_reasoning}
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
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
            <p style={{ margin: 0, lineHeight: "1.6" }}>{result.summary}</p>
          </div>

          {/* Keywords */}
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
              {result.keywords.split(",").map((keyword, index) => (
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

          {/* Sentiment Distribution */}
          {parsedResult.sentiment?.sentiment_distribution && (
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
              {parsedResult.sentiment.sentiment_distribution.map((item, index) => (
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
                  {item.emotional_indicators.length > 0 && 
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
          {parsedResult.dialogue?.dialogue_history && (
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
                {parsedResult.dialogue.dialogue_history.map((turn, index) => (
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
        <strong>Supported inputs:</strong> Customer conversations, support tickets, feedback, or any text
        <br />
        <strong>Analysis features:</strong> Sentiment analysis, case categorization, priority assessment
        <br />
        <strong>Best results:</strong> Customer service interactions and structured conversations
        <br />
        <strong>Processing time:</strong> Usually completes within 10-30 seconds
      </div>
    </div>
  );
}