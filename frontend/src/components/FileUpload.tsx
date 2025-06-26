import React, { useState, type JSX } from "react";
import axios, { AxiosError } from "axios";

interface ProcessResult {
  document_type?: string;
  error?: string;
  raw_text?: string;
  extracted_json?: string;
}

interface FileUploadProps {
  onResult: (data: ProcessResult) => void;
}

interface ErrorResponse {
  detail?: string;
}

export default function FileUpload({ onResult }: FileUploadProps): JSX.Element {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageZoom, setImageZoom] = useState<number>(1);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      setFile(selectedFile);
      setError("");

      // Create preview for images
      if (selectedFile.type.startsWith("image/")) {
        const url = URL.createObjectURL(selectedFile);
        setImageUrl(url);
      } else {
        setImageUrl("");
      }
      setImageZoom(1);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError("");

      // Create preview for images
      if (selectedFile.type.startsWith("image/")) {
        const url = URL.createObjectURL(selectedFile);
        setImageUrl(url);
      } else {
        setImageUrl("");
      }
      setImageZoom(1);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setError("");
    setLoading(true);

    const form = new FormData();
    form.append("document", file);

    try {
      const res = await axios.post<ProcessResult>(
        "https://riu-rd-contact-center-operations.hf.space/image/process-document",
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 60000, // 60 second timeout
        }
      );
      onResult(res.data);
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

  const handleZoomIn = () => {
    setImageZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setImageZoom((prev) => Math.max(prev - 0.25, 0.25));
  };

  const resetZoom = () => {
    setImageZoom(1);
  };

  return (
    <div style={{ marginBottom: "30px" }}>
      <h2 style={{ color: "#B11116", marginBottom: "20px" }}>
        Upload Document
      </h2>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            border: `2px dashed ${dragActive ? "#B11116" : "#dee2e6"}`,
            borderRadius: "12px",
            padding: "40px 20px",
            textAlign: "center",
            backgroundColor: dragActive ? "#fff5f5" : "#f8f9fa",
            transition: "all 0.3s ease",
            cursor: "pointer",
            marginBottom: "20px",
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => {
            const fileInput = document.getElementById(
              "file-input"
            ) as HTMLInputElement;
            fileInput?.click();
          }}
        >
          <input
            id="file-input"
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <div style={{ fontSize: "48px", marginBottom: "15px" }}>📄</div>

          {file ? (
            <div>
              <p
                style={{
                  margin: "0 0 10px 0",
                  fontWeight: "bold",
                  color: "#B11116",
                }}
              >
                Selected: {file.name}
              </p>
              <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                Click to change file or drag and drop a new one
              </p>
            </div>
          ) : (
            <div>
              <p style={{ margin: "0 0 10px 0", fontWeight: "bold" }}>
                Drag and drop your document here
              </p>
              <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                or click to browse files
              </p>
            </div>
          )}
        </div>

        {/* Image Preview Section */}
        {imageUrl && (
          <div
            style={{
              marginBottom: "20px",
              border: "1px solid #dee2e6",
              borderRadius: "8px",
              padding: "15px",
              backgroundColor: "#f8f9fa",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <h4 style={{ margin: 0, color: "#333" }}>Image Preview</h4>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  style={{
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Zoom Out
                </button>
                <button
                  type="button"
                  onClick={resetZoom}
                  style={{
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  style={{
                    backgroundColor: "#6c757d",
                    color: "white",
                    border: "none",
                    padding: "5px 10px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Zoom In
                </button>
              </div>
            </div>
            <div
              style={{
                maxHeight: "400px",
                overflow: "auto",
                border: "1px solid #ccc",
                borderRadius: "4px",
                textAlign: "center",
                backgroundColor: "white",
              }}
            >
              <img
                src={imageUrl}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  transform: `scale(${imageZoom})`,
                  transition: "transform 0.2s ease",
                  transformOrigin: "center center",
                }}
              />
            </div>
            <p
              style={{
                margin: "10px 0 0 0",
                fontSize: "12px",
                color: "#666",
                textAlign: "center",
              }}
            >
              Zoom: {Math.round(imageZoom * 100)}%
            </p>
          </div>
        )}

        {/* PDF Preview Message */}
        {file && file.type === "application/pdf" && (
          <div
            style={{
              marginBottom: "20px",
              padding: "15px",
              backgroundColor: "#e3f2fd",
              border: "1px solid #bbdefb",
              borderRadius: "8px",
              color: "#1565c0",
            }}
          >
            <strong>PDF File Selected:</strong> {file.name}
            <br />
            <small>PDF preview will be available after processing</small>
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
              Processing...
            </span>
          ) : (
            <span>
              <span style={{ marginRight: "8px" }}>🔍</span>
              Analyze Document
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
        <strong>Supported formats:</strong> JPG, PNG, GIF, BMP, TIFF, PDF
        <br />
        <strong>Max file size:</strong> 10MB
        <br />
        <strong>Document types:</strong> Deposit slips, withdrawal slips,
        customer information sheets
      </div>
    </div>
  );
}
