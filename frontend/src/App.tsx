import React, { useState, type JSX } from "react";
import FileUpload from "./components/FileUpload";
import ResultDisplay from "./components/ResultDisplay";
import AudioInsights from "./components/AudioInsights";
import TextInsights from "./components/TextInsights";
import "./App.css";

interface MenuItem {
  key: string;
  label: string;
}

interface ProcessResult {
  document_type?: string;
  error?: string;
  raw_text?: string;
  extracted_json?: string;
}

function App(): JSX.Element {
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [view, setView] = useState<string>("image");

  const menuItems: MenuItem[] = [
    { key: "image", label: "Image to Insights" },
    { key: "text", label: "Text to Insights" },
    { key: "audio", label: "Audio to Insights" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <aside
        style={{
          width: 200,
          backgroundColor: "#B11116",
          color: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          padding: "20px 0",
        }}
      >
        {menuItems.map((item) => (
          <div
            key={item.key}
            onClick={() => setView(item.key)}
            style={{
              padding: "10px 20px",
              cursor: "pointer",
              backgroundColor: view === item.key ? "#F3CE32" : "transparent",
              color: view === item.key ? "#B11116" : "#FFFFFF",
              fontWeight: view === item.key ? "bold" : "normal",
            }}
          >
            {item.label}
          </div>
        ))}
      </aside>
      <main
        style={{
          flex: 1,
          backgroundColor: "#FFFFFF",
          padding: "40px",
          overflowY: "auto",
        }}
      >
        <h1>Contact Center Operation Insights</h1>
        {view === "image" && (
          <>
            <FileUpload onResult={setResult} />
            <ResultDisplay data={result} />
          </>
        )}
        {view === "text" && <TextInsights />}
        {view === "audio" && <AudioInsights />}
      </main>
    </div>
  );
}

export default App;
