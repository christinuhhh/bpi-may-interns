import React from 'react';

export default function ResultDisplay({ data }) {
  if (!data) return null;

  const { document_type, error, raw_text, extracted_json } = data;

  if (error) {
    return (
      <div style={{ color: 'red', padding: '20px', backgroundColor: '#ffe6e6', borderRadius: '8px' }}>
        <h3>Error Processing Document</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '20px' }}>
      <h2 style={{ color: '#B11116', marginBottom: '20px' }}>
        Document Type: {document_type || 'Unknown'}
      </h2>

      {raw_text && (
        <section style={{ marginBottom: '30px' }}>
          <h3 style={{ color: '#333', borderBottom: '2px solid #F3CE32', paddingBottom: '10px' }}>
            Raw OCR Text
          </h3>
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <pre style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.4'
            }}>
              {raw_text}
            </pre>
          </div>
        </section>
      )}

      {extracted_json && (
        <section>
          <h3 style={{ color: '#333', borderBottom: '2px solid #F3CE32', paddingBottom: '10px' }}>
            Extracted JSON
          </h3>
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <pre style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.4'
            }}>
              {extracted_json}
            </pre>
          </div>
        </section>
      )}
    </div>
  );
}
