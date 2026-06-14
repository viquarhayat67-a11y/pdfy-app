import React, { useState, useRef } from 'react';

export default function SignPdf({ pdfLibLoaded, onBack }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef(null);
  const isDrawing = useRef(false);

  // Canvas drawing mechanisms
  const startDrawing = (e) => {
    e.preventDefault?.();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    isDrawing.current = true;
  };

  const draw = (e) => {
    e.preventDefault?.();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
  };


  const stopDrawing = () => { isDrawing.current = false; };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSignPdf = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const { PDFDocument } = window.PDFLib;
      const fileBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      // Convert Canvas signature into a PNG base64 string layout
      const signatureImageBytes = canvasRef.current.toDataURL('image/png');
      const embeddedImage = await pdfDoc.embedPng(signatureImageBytes);

      // Render signature stamp image overlay into bottom left margins of page 1
      firstPage.drawImage(embeddedImage, {
        x: 50,
        y: 50,
        width: 150,
        height: 60,
      });

      const signedBytes = await pdfDoc.save();
      const blob = new Blob([signedBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `signed_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to inject digital signature vector layer.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>✍️ Digital Signature Pad</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Draw your signature and stamp it onto the document natively.</p>
        </div>
        <button onClick={onBack} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Back</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: file ? '1fr 1fr' : '1fr', gap: '25px' }}>
        <div>
          <div style={{ border: '2px dashed #cbd5e1', padding: '30px', textAlign: 'center', borderRadius: '12px', backgroundColor: '#f8fafc', position: 'relative', marginBottom: '15px' }}>
            <span>📝</span>
            <h4>{file ? file.name : 'Select PDF Document to Sign'}</h4>
            <input type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
          </div>
        </div>

        {file && (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '8px', textAlign: 'left' }}>Draw Signature inside panel box:</span>
            <canvas 
              ref={canvasRef} width={300} height={120}
              onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); startDrawing(e); }}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              style={{ border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '8px', cursor: 'crosshair', display: 'block', width: '100%', touchAction: 'none' }}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={clearCanvas} style={{ flex: 1, padding: '8px', cursor: 'pointer', backgroundColor: '#ef4444', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: '600' }}>Clear Pad</button>
              <button onClick={handleSignPdf} disabled={isProcessing} style={{ flex: 2, padding: '8px', cursor: 'pointer', backgroundColor: '#22c55e', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: '600' }}>
                {isProcessing ? "Stamping signature..." : "✍️ Stamp & Download"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}