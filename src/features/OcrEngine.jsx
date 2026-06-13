import React, { useState } from 'react';


export default function OcrEngine({ tesseractLoaded, onBack }) {
  const [image, setImage] = useState(null);
  const [textResult, setTextResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target.result);
        setTextResult('');
        setProgress('');
      };
      reader.readAsDataURL(file);
    }
  };

  const runOCR = async () => {
    if (!image) return;
    setIsProcessing(true);
    setProgress('Initializing Tesseract Core...');

    try {
      // Tesseract loads globally via CDN as window.Tesseract
      const { createWorker } = window.Tesseract;
      
      // Create a worker instance
      const worker = await createWorker('eng');
      
      // Monitor status logs
      setProgress('Recognizing Text patterns...');
      
      // Perform text recognition
      const { data: { text } } = await worker.recognize(image);
      
      setTextResult(text || "No text could be extracted from this image.");
      await worker.terminate();
    } catch (error) {
      console.error("OCR Failed", error);
      setTextResult("Error: Failed to process the image locally.");
    } finally {
      setIsProcessing(false);
      setProgress('');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(textResult);
    alert("Text copied to clipboard!");
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>🔍 Smart OCR Text Extractor</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Extract editable text strings from images completely inside your browser memory.</p>
        </div>
        <button onClick={onBack} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
          Back
        </button>
      </div>

      {!tesseractLoaded ? (
        <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px' }}>
          ⏳ Waiting for local Tesseract.js language packs to finish loading from CDN pipeline...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: image ? '1fr 1fr' : '1fr', gap: '25px' }}>
          
          {/* Dropzone / Upload area */}
          <div>
            <div style={{ border: '2px dashed #cbd5e1', padding: '30px', textAlign: 'center', borderRadius: '8px', backgroundColor: '#f8fafc', position: 'relative', marginBottom: '15px' }}>
              <p style={{ margin: 0 }}>{image ? 'Change Image' : 'Select or Drop Document Image (PNG/JPG)'}</p>
              <input type="file" accept="image/*" onChange={handleImageChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            </div>

            {image && (
              <div style={{ textAlign: 'center' }}>
                <img src={image} alt="Source Document" style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #cbd5e1', marginBottom: '15px' }} />
                {!isProcessing && (
                  <button onClick={runOCR} style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', width: '100%', cursor: 'pointer' }}>
                    🔍 Extract Text From Image
                  </button>
                )}
              </div>
            )}

            {isProcessing && (
              <div style={{ textAlign: 'center', padding: '15px', color: '#4f46e5', fontWeight: '600' }}>
                ⏳ {progress}
              </div>
            )}
          </div>

          {/* Text Result Panel */}
          {image && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Extracted Result:</span>
                {textResult && (
                  <button onClick={copyToClipboard} style={{ padding: '4px 10px', fontSize: '12px', border: '1px solid #cbd5e1', backgroundColor: '#fff', borderRadius: '4px', cursor: 'pointer' }}>
                    📋 Copy Text
                  </button>
                )}
              </div>
              <textarea 
                readOnly
                value={textResult} 
                placeholder="Extracted data will materialize here..." 
                style={{ flexGrow: 1, minHeight: '250px', width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '13px', resize: 'none', boxSizing: 'border-box', backgroundColor: '#f8fafc' }}
              />
            </div>
          )}

        </div>
      )}
    </div>
  );
}