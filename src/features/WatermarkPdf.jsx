import React, { useState } from 'react';

export default function WatermarkPdf({ pdfLibLoaded, onBack }) {
  const [file, setFile] = useState(null);
  const [text, setText] = useState('CONFIDENTIAL');
  const [opacity, setOpacity] = useState(0.3);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApplyWatermark = async () => {
    if (!file || !text) return;
    setIsProcessing(true);

    try {
      const { PDFDocument, rgb, degrees, StandardFonts } = window.PDFLib;
      const fileBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      const pages = pdfDoc.getPages();
      
      // Embed a default Helvetica font layer
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      pages.forEach(page => {
        const { width, height } = page.getSize();
        
        // Render stylized watermark diagonally across the canvas sheet
        page.drawText(text, {
          x: width / 4,
          y: height / 3,
          size: 50,
          font: helveticaFont,
          color: rgb(0.7, 0.1, 0.1), // Classic soft red stamp tone
          opacity: parseFloat(opacity),
          rotate: degrees(45),
        });
      });

      const watermarkedBytes = await pdfDoc.save();
      const blob = new Blob([watermarkedBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `watermarked_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to inject security watermark layer.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>🛡️ Security Watermark Stamp</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Stamp custom transparency text overlays across all document layers seamlessly.</p>
        </div>
        <button onClick={onBack} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Back</button>
      </div>

      <div style={{ border: '2px dashed #cbd5e1', padding: '40px 20px', textAlign: 'center', borderRadius: '12px', backgroundColor: '#f8fafc', position: 'relative', marginBottom: '20px' }}>
        <span>🛡️</span>
        <h4>{file ? file.name : 'Select PDF file to secure'}</h4>
        <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
      </div>

      {file && (
        <div style={{ maxWidth: '500px', margin: '0 auto', padding: '25px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Watermark String Text:</label>
            <input 
              type="text" 
              value={text} 
              onChange={(e) => setText(e.target.value.toUpperCase())}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
              <label>Stamp Opacity Intensity:</label>
              <span style={{ color: '#4f46e5' }}>{Math.round(opacity * 100)}%</span>
            </div>
            <input 
              type="range" min="0.1" max="0.8" step="0.05"
              value={opacity} 
              onChange={(e) => setOpacity(e.target.value)}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          <button onClick={handleApplyWatermark} disabled={isProcessing || !text} style={{ width: '100%', backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
            {isProcessing ? "Stamping secure text channels..." : "🔒 Stamp Watermark & Download"}
          </button>
        </div>
      )}
    </div>
  );
}