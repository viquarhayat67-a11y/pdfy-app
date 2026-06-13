import React, { useState } from 'react';
import { addHistoryLog } from '../components/HistoryLog';

export default function ImageToPdf({ jsPdfLoaded, onBack }) {
  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle uploading/dropping multiple images
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || e.dataTransfer.files);
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return; // skip non-images
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setImages(prev => [...prev, { 
          id: Math.random().toString(), 
          name: file.name, 
          src: event.target.result 
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const clearAll = () => setImages([]);

  // The actual compilation engine using your loaded jsPDF library
  const convertToPdf = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    try {
      // jsPDF exposes itself globally under window.jspdf when loaded via CDN
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      // A4 dimensions in mm
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const maxWidth = pageWidth - (margin * 2);
      const maxHeight = pageHeight - (margin * 2);

      for (let i = 0; i < images.length; i++) {
        if (i > 0) pdf.addPage();
        
        // Render image onto the PDF page canvas frame
        pdf.addImage(images[i].src, 'JPEG', margin, margin, maxWidth, maxHeight, undefined, 'FAST');
      }

      pdf.save('PDFy_converted_images.pdf');
      addHistoryLog(
        'Image to PDF', 
        `${images.length} Image${images.length > 1 ? 's' : ''}`, 
        '🖼️', 
        'Compiled'
      );

    } catch (error) {
      console.error("PDF generation failed", error);
      alert("Failed to build PDF. Please check that your browser developer console isn't blocking jsPDF scripts.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {/* Active Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🖼️</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Image to PDF Workspace</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Convert standard image elements directly into a single multi-page document layout.</p>
          </div>
        </div>
        <button 
          onClick={onBack} 
          style={{ backgroundColor: '#f1f5f9', color: '#334155', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
        >
          Back to Dashboard
        </button>
      </div>

      {!jsPdfLoaded ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#b45309', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
          ⏳ Loading client-side layout structures from jsPDF engine...
        </div>
      ) : (
        <div>
          {/* Main Upload Dropzone */}
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleImageUpload(e); }}
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '40px 20px',
              backgroundColor: '#f8fafc',
              textAlign: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'border-color 0.2s'
            }}
          >
            <span style={{ fontSize: '40px' }}>📥</span>
            <h4 style={{ fontSize: '16px', margin: '12px 0 6px 0', fontWeight: '600' }}>Drag & drop your images here</h4>
            <p style={{ color: '#94a3b8', margin: '0 0 10px 0', fontSize: '13px' }}>Supports PNG, JPG, JPEG, and WebP assets</p>
            <span style={{ display: 'inline-block', backgroundColor: '#4f46e5', color: '#fff', padding: '6px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: '500' }}>
              Browse Files
            </span>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleImageUpload} 
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
            />
          </div>

          {/* Uploaded Items Queue Display */}
          {images.length > 0 && (
            <div style={{ marginTop: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569' }}>Selected Images ({images.length})</span>
                <button onClick={clearAll} style={{ border: 'none', background: 'transparent', color: '#ef4444', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>Clear All</button>
              </div>

              {/* Grid Layout List */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px', maxHeight: '300px', overflowY: 'auto', padding: '8px 2px' }}>
                {images.map((img, index) => (
                  <div key={img.id} style={{ position: 'relative', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '6px', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)' }}>
                    <div style={{ position: 'absolute', top: '-6px', left: '-6px', backgroundColor: '#334155', color: '#fff', fontSize: '10px', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>
                      {index + 1}
                    </div>
                    <img src={img.src} alt="preview" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '6px' }} />
                    <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '4px', padding: '0 2px' }}>
                      {img.name}
                    </div>
                    <button 
                      onClick={() => removeImage(img.id)}
                      style={{ position: 'absolute', top: '2px', right: '2px', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button 
                onClick={convertToPdf} 
                disabled={isProcessing}
                style={{
                  backgroundColor: '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  width: '100%',
                  padding: '14px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: 'pointer',
                  marginTop: '20px',
                  boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
                }}
              >
                {isProcessing ? 'Compiling PDF Generation Layouts...' : '✨ Generate & Download Multi-Page PDF'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}