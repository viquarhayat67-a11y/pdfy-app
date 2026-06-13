import React, { useState } from 'react';

export default function WordToPdf({ mammothLoaded, jsPdfLoaded, onBack }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.docx')) {
      setFile(selectedFile);
      setErrorMessage('');
      setPreviewHtml('');
    } else {
      setErrorMessage('Please select a valid Word document (.docx format).');
    }
  };

  const convertWordToPdf = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const fileReader = new FileReader();
      fileReader.onload = async (loadEvent) => {
        try {
          const arrayBuffer = loadEvent.target.result;
          
          // Use Mammoth to convert Word binary structure into clean HTML strings
          const result = await window.mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
          const htmlContent = result.value; 
          setPreviewHtml(htmlContent); // Show preview container text

          // Use jsPDF to generate a document containing that text
          const { jsPDF } = window.jspdf;
          const pdf = new jsPDF();
          
          // Split the text content into standard margins and print to PDF canvas
          const lines = pdf.splitTextToSize(htmlContent.replace(/<[^>]*>/g, ''), 180);
          pdf.text(lines, 14, 20);
          
          pdf.save(`${file.name.replace('.docx', '')}.pdf`);
          setIsProcessing(false);
        } catch (err) {
          setErrorMessage('Failed to compile internal document formatting.');
          setIsProcessing(false);
        }
      };
      fileReader.readAsArrayBuffer(file);
    } catch (error) {
      setErrorMessage('An unexpected error occurred during rendering.');
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>📄 Local Word to PDF Converter</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Safely transform Word (.docx) files into standard PDF formats in local memory.</p>
        </div>
        <button onClick={onBack} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
          Back
        </button>
      </div>

      {!mammothLoaded || !jsPdfLoaded ? (
        <div style={{ padding: '20px', backgroundColor: '#fef3c7', color: '#b45309', borderRadius: '8px' }}>
          ⏳ Syncing conversion libraries from CDN network mirrors...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: file ? '1fr 1fr' : '1fr', gap: '20px' }}>
          
          {/* File input */}
          <div>
            <div style={{ border: '2px dashed #cbd5e1', padding: '40px 20px', textAlign: 'center', borderRadius: '12px', backgroundColor: '#f8fafc', position: 'relative', marginBottom: '15px' }}>
              <span style={{ fontSize: '32px' }}>📝</span>
              <h4 style={{ margin: '10px 0 5px 0' }}>{file ? file.name : 'Select Word File (.docx)'}</h4>
              <input type="file" accept=".docx" onChange={handleFileChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            </div>

            {file && !isProcessing && (
              <button onClick={convertWordToPdf} style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', width: '100%', fontWeight: '600', cursor: 'pointer' }}>
                🚀 Convert to PDF Layout
              </button>
            )}

            {isProcessing && <p style={{ color: '#4f46e5', textAlign: 'center', fontWeight: '600' }}>Generating file bytes...</p>}
            {errorMessage && <p style={{ color: '#ef4444' }}>⚠️ {errorMessage}</p>}
          </div>

          {/* Visual Canvas Layout Live Preview */}
          {previewHtml && (
            <div style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '8px', backgroundColor: '#fafafa', maxHeight: '300px', overflowY: 'auto' }}>
              <h5 style={{ margin: '0 0 10px 0', color: '#475569' }}>Parsed Document Outline Preview:</h5>
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} style={{ fontSize: '13px', lineHeight: '1.5' }} />
            </div>
          )}

        </div>
      )}
    </div>
  );
}