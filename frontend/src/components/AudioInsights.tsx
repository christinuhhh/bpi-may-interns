import React, { useState, type JSX } from "react";
import AudioWhisper from "./AudioWhisper";
import AudioGemini from "./AudioGemini";
import AudioDiarization from "./AudioDiarization";

export default function AudioInsights(): JSX.Element {
  const [activeTab, setActiveTab] = useState<string>("whisper");

  const tabs = [
    { key: "whisper", label: "Whisper Transcription", icon: "🎵" },
    { key: "gemini", label: "Gemini Processing", icon: "🤖" },
    { key: "diarization", label: "Speaker Diarization", icon: "👥" },
  ];

  return (
    <div>
      <h2 style={{ color: "#B11116", marginBottom: "20px" }}>
        Audio to Insights
      </h2>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          borderBottom: "2px solid #dee2e6",
          marginBottom: "30px",
          overflow: "auto",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "12px 20px",
              border: "none",
              backgroundColor:
                activeTab === tab.key ? "#B11116" : "transparent",
              color: activeTab === tab.key ? "white" : "#666",
              fontWeight: activeTab === tab.key ? "bold" : "normal",
              cursor: "pointer",
              borderBottom:
                activeTab === tab.key ? "none" : "2px solid transparent",
              transition: "all 0.3s ease",
              fontSize: "14px",
              whiteSpace: "nowrap",
              borderRadius: activeTab === tab.key ? "8px 8px 0 0" : "0",
            }}
          >
            <span style={{ marginRight: "8px" }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "whisper" && <AudioWhisper />}
        {activeTab === "gemini" && <AudioGemini />}
        {activeTab === "diarization" && <AudioDiarization />}
      </div>

      {/* General Information */}
      <div
        style={{
          backgroundColor: "#fff3cd",
          border: "1px solid #ffeaa7",
          borderRadius: "8px",
          padding: "15px",
          marginTop: "30px",
          fontSize: "14px",
          color: "#856404",
        }}
      >
        <h4 style={{ margin: "0 0 10px 0", color: "#856404" }}>
          Audio Processing Information
        </h4>
        <p style={{ margin: "0 0 10px 0" }}>
          <strong>Whisper:</strong> OpenAI's robust speech-to-text model with
          automatic language detection and translation.
        </p>
        <p style={{ margin: "0 0 10px 0" }}>
          <strong>Gemini:</strong> Google's advanced AI model for audio
          transcription and intelligent processing.
        </p>
        <p style={{ margin: 0 }}>
          <strong>Diarization:</strong> Advanced speaker identification and
          conversation analysis for multi-speaker audio.
        </p>
      </div>
    </div>
  );
}
