import React, { useState } from 'react';

export default function MetadataPdf({ pdfLibLoaded, onBack }) {
  const [file, setFile] = useState(null);
  const [meta, setMeta] = useState({ title: '', author: '', subject: '', creator: '', keywords: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      
      try {
        const { PDFDocument } = window.PDFLib;
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // Extract existing metadata fields from the PDF dictionary
        setMeta({
          title: pdfDoc.getTitle() || '',
          author: pdfDoc.getAuthor() || '',
          subject: pdfDoc.getSubject() || '',
          creator: pdfDoc.getCreator() || '',
          keywords: pdfDoc.getKeywords() || '',
        });
      } catch (err) {
        alert("Failed to parse internal PDF metadata dictionary layout.");
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMeta(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveMetadata = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const { PDFDocument } = window.PDFLib;
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Rewrite fields with updated client string inputs
      pdfDoc.setTitle(meta.title);
      pdfDoc.setAuthor(meta.author);
      pdfDoc.setSubject(meta.subject);
      pdfDoc.setCreator(meta.creator);
      pdfDoc.setKeywords(meta.keywords);

      const modifiedBytes = await pdfDoc.save();
      const blob = new Blob([modifiedBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `sanitized_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("An error occurred while compiling metadata maps.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>🏷️ PDF Metadata Inspector & Sanitizer</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Inspect, rewrite, or completely wipe tracking properties from document dictionaries.</p>
        </div>
        <button onClick={onBack} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Back</button>
      </div>

      <div style={{ border: '2px dashed #cbd5e1', padding: '30px', textAlign: 'center', borderRadius: '12px', backgroundColor: '#f8fafc', position: 'relative', marginBottom: '20px' }}>
        <span>🏷️</span>
        <h4>{file ? file.name : 'Select PDF file to inspect dictionary headers'}</h4>
        <input type="file" accept=".pdf" onChange={handleFileChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
      </div>

      {file && (
        <div style={{ maxWidth: '550px', margin: '0 auto', padding: '25px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#334155' }}>Document Properties</h4>
          
          {['title', 'author', 'subject', 'creator', 'keywords'].map((field) => (
            <div key={field} style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize', marginBottom: '4px', color: '#475569' }}>{field}:</label>
              <input 
                type="text" name={field} value={meta[field]} onChange={handleInputChange}
                placeholder={`No ${field} tag specified`}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>
          ))}

          <button onClick={handleSaveMetadata} disabled={isProcessing} style={{ width: '100%', backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginTop: '10px' }}>
            {isProcessing ? "Updating headers..." : "💾 Update Metadata & Download"}
          </button>
        </div>
      )}
    </div>
  );
}