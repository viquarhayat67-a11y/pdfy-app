import React, { useState, useRef, useEffect } from 'react';

export default function PassportPhotoMaker() {
  const [imageSrc, setImageSrc] = useState(null);
  const [country, setCountry] = useState('us'); // 'us' or 'eu'
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [previewSheet, setPreviewSheet] = useState(null);

  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Passport dimensions configurations
  const dimensions = {
    us: { width: 600, height: 600, label: 'US / India (2x2 inches, Square)' },
    eu: { width: 413, height: 531, label: 'UK / EU / Canada (3.5x4.5 cm)' }
  };

  const currentDim = dimensions[country];

  // Redraw canvas whenever layout properties update
  useEffect(() => {
    if (imageSrc) {
      drawPassportPhoto();
    }
  }, [imageSrc, country, scale, offsetX, offsetY]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result);
        setScale(1);
        setOffsetX(0);
        setOffsetY(0);
        setPreviewSheet(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const drawPassportPhoto = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    // Clear previous drawing data paths
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fill standard solid brilliant white background mandatory for official documents
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate base centering scaling variables
    const imgWidth = img.width;
    const imgHeight = img.height;
    
    const ratioX = canvas.width / imgWidth;
    const ratioY = canvas.height / imgHeight;
    const baseScale = Math.max(ratioX, ratioY);

    const drawW = imgWidth * baseScale * scale;
    const drawH = imgHeight * baseScale * scale;

    const startX = (canvas.width - drawW) / 2 + offsetX;
    const startY = (canvas.height - drawH) / 2 + offsetY;

    ctx.drawImage(img, startX, startY, drawW, drawH);
  };

  // Drag and drop image adjustment event listeners
  const handleMouseDown = (e) => {
    if (!imageSrc) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => setIsDragging(false);

  // Generates a 4x6 inch standard canvas sheet matrix containing 6 aligned duplicates
  const generatePrintSheet = () => {
    const sourceCanvas = canvasRef.current;
    const sheetCanvas = document.createElement('canvas');
    const ctx = sheetCanvas.getContext('2d');

    // Standard 4x6 inch dimension footprint at 300 DPI resolution scale matrix
    sheetCanvas.width = 1800;
    sheetCanvas.height = 1200;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);

    // Calculate dynamic positioning parameters for 2 rows of 3 photos
    const targetW = country === 'us' ? 500 : 413;
    const targetH = country === 'us' ? 500 : 531;

    const positions = [
      { x: 100, y: 70 },   { x: 650, y: 70 },   { x: 1200, y: 70 },
      { x: 100, y: 620 },  { x: 650, y: 620 },  { x: 1200, y: 620 }
    ];

    positions.forEach((pos) => {
      ctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, pos.x, pos.y, targetW, targetH);
      // Light outer boundary stroke lines to help with precise scissor cutting
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(pos.x, pos.y, targetW, targetH);
    });

    setPreviewSheet(sheetCanvas.toDataURL('image/jpeg', 0.95));
  };

  const downloadImage = (url, name) => {
    const link = document.createElement('a');
    link.href = url || canvasRef.current.toDataURL('image/jpeg', 0.95);
    link.download = name || `passport_photo_${country}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>📸 Passport Size Photo Maker</h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Crop, scale, and compile official biometric passport pictures entirely inside your browser sandbox.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: imageSrc ? '1fr 1fr' : '1fr', gap: '30px' }}>
        
        {/* LEFT WORKSPACE CONTROLLER SIDE PANEL */}
        <div>
          <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '30px', textAlign: 'center', backgroundColor: '#f8fafc', marginBottom: '20px' }}>
            <input type="file" accept="image/*" onChange={handleFileChange} id="photo-picker" style={{ display: 'none' }} />
            <label htmlFor="photo-picker" style={{ cursor: 'pointer', display: 'block' }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '8px' }}>📷</span>
              <span style={{ fontWeight: '600', color: '#2563eb', fontSize: '15px' }}>Upload raw headshot image</span>
            </label>
          </div>

          {imageSrc && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Target Output Specification</label>
                <select value={country} onChange={(e) => { setCountry(e.target.value); setPreviewSheet(null); }} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                  <option value="us">{dimensions.us.label}</option>
                  <option value="eu">{dimensions.eu.label}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'between', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>
                  Scale / Zoom Adjustment Slider
                </label>
                <input type="range" min="0.5" max="3" step="0.01" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} style={{ width: '100%', cursor: 'pointer' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => downloadImage(null, null)} style={{ flex: 1, backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                  Download Single Photo
                </button>
                <button onClick={generatePrintSheet} style={{ flex: 1, backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
                  Generate Printable 4x6 Sheet
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0, textAlign: 'center' }}>💡 Click and drag the photo on the right canvas layout to position your face perfectly.</p>
            </div>
          )}
        </div>

        {/* RIGHT LIVE CANVAS PREVIEW PANEL MAP */}
        {imageSrc && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div 
              style={{ 
                border: '4px solid #0f172a', 
                borderRadius: '8px', 
                overflow: 'hidden', 
                cursor: isDragging ? 'grabbing' : 'grab',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                width: `${currentDim.width / 1.5}px`,
                height: `${currentDim.height / 1.5}px`,
                position: 'relative'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Overlay guides to assist centering eyes and chin structure alignment */}
              <div style={{ position: 'absolute', top: '0', left: '50%', width: '1px', height: '100%', borderLeft: '1px dashed rgba(37,99,235,0.3)', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: '40%', left: '0', width: '100%', height: '1px', borderTop: '1px dashed rgba(37,99,235,0.3)', pointerEvents: 'none' }} />
              
              <canvas 
                ref={canvasRef} 
                width={currentDim.width} 
                height={currentDim.height} 
                style={{ width: '100%', height: '100%', display: 'block' }}
              />
            </div>
            
            {/* Hidden image element used as canvas source data mapping */}
            <img ref={imageRef} src={imageSrc} alt="source" onLoad={drawPassportPhoto} style={{ display: 'none' }} />
          </div>
        )}
      </div>

      {/* PRINT-READY SHEET WORKSPACE DROPDOWN DISPLAY AREA */}
      {previewSheet && (
        <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '2px solid #e2e8f0', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700' }}>✨ Print-Ready 4x6 Photo Sheet Generated</h3>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: 0, marginBottom: '20px' }}>This high-resolution sheet grid is scaled optimally for home or commercial photo printers.</p>
          <img src={previewSheet} alt="Print Sheet" style={{ maxWidth: '100%', width: '450px', borderRadius: '8px', border: '1px solid #cbd5e1', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }} />
          <div style={{ marginTop: '16px' }}>
            <button onClick={() => downloadImage(previewSheet, `printable_sheet_${country}.jpg`)} style={{ backgroundColor: '#0f172a', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
              Download Print Sheet (.JPG)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}