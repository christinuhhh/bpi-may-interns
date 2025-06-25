import React, { useState } from 'react';
import axios from 'axios';

export default function FileUpload({ onResult }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError('');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!file) return setError('Please select a file first.');
    
    setError('');
    setLoading(true);

    const form = new FormData();
    form.append('document', file);

    try {
      const res = await axios.post(
        'http://localhost:8000/api/process',
        form,
        { 
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000 // 60 second timeout
        }
      );
      onResult(res.data);
    } catch (err) {
      console.error('Upload error:', err);
      if (err.response) {
        setError(`Server error: ${err.response.data.detail || err.response.statusText}`);
      } else if (err.request) {
        setError('Network error: Unable to connect to server. Please check if the backend is running.');
      } else {
        setError('Upload failed: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '30px' }}>
      <h2 style={{ color: '#B11116', marginBottom: '20px' }}>
        Upload Document
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div
          style={{
            border: `2px dashed ${dragActive ? '#B11116' : '#dee2e6'}`,
            borderRadius: '12px',
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: dragActive ? '#fff5f5' : '#f8f9fa',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
        >
          <input
            id="file-input"
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📄</div>
          
          {file ? (
            <div>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#B11116' }}>
                Selected: {file.name}
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                Click to change file or drag and drop a new one
              </p>
            </div>
          ) : (
            <div>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                Drag and drop your document here
              </p>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                or click to browse files
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          style={{
            backgroundColor: loading || !file ? '#ccc' : '#B11116',
            color: 'white',
            border: 'none',
            padding: '12px 30px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading || !file ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s ease',
            width: '100%',
            maxWidth: '300px'
          }}
        >
          {loading ? (
            <span>
              <span style={{ marginRight: '8px' }}>⏳</span>
              Processing...
            </span>
          ) : (
            <span>
              <span style={{ marginRight: '8px' }}>🔍</span>
              Analyze Document
            </span>
          )}
        </button>
      </form>

      {error && (
        <div style={{
          color: '#721c24',
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          padding: '15px',
          marginTop: '15px',
          fontSize: '14px'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{
        backgroundColor: '#e7f3ff',
        border: '1px solid #b3d9ff',
        borderRadius: '8px',
        padding: '15px',
        marginTop: '20px',
        fontSize: '14px',
        color: '#004085'
      }}>
        <strong>Supported formats:</strong> JPG, PNG, GIF, BMP, TIFF, PDF
        <br />
        <strong>Max file size:</strong> 10MB
        <br />
        <strong>Document types:</strong> Deposit slips, withdrawal slips, customer information sheets
      </div>
    </div>
  );
}
