import React, { useState, useEffect, useRef } from 'react';

export default function RotatePdf({ pdfJsLoaded, pdfLibLoaded, onBack }) {
  const [file, setFile] = useState(null);
  const [pagesData, setPagesData] = useState([]); // Keeps track of [{ pageNum, currentRotation }]
  const [selectedPage, setSelectedPage] = useState(null); // Tracks which page index is clicked
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const thumbnailContainerRef = useRef({});

  // Reset states when a new file is dropped
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setPagesData([]);
      setSelectedPage(null);
      generateThumbnails(selectedFile);
    }
  };

  // Uses pdf.js to extract page layouts and draw them onto hidden canvas snapshots
  const generateThumbnails = async (targetFile) => {
    setLoadingStatus('Parsing PDF structure and building visual map...');
    try {
      const arrayBuffer = await targetFile.arrayBuffer();
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const setupData = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        setupData.push({ pageNum: i, visualRotation: 0 });
      }
      setPagesData(setupData);
      setSelectedPage(0); // Auto-select page 1

      // Render thumbnails into state asynchronously
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 }); // Small thumbnail size
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        thumbnailContainerRef.current[i] = canvas.toDataURL();
        
        // Force state update to show previews dynamically as they load
        setPagesData(prev => [...prev]);
      }
      setLoadingStatus('');
    } catch (err) {
      console.error(err);
      setLoadingStatus('Failed to generate visual preview thumbnails.');
    }
  };

  // Adjust the rotation state angle for the selected page (+90 degrees)
  const rotateSelectedPage = () => {
    if (selectedPage === null) return;
    setPagesData(prev => prev.map((page, idx) => {
      if (idx === selectedPage) {
        return { ...page, visualRotation: (page.visualRotation + 90) % 360 };
      }
      return page;
    }));
  };

  // Compiles and downloads using pdf-lib, injecting modified degrees into specific bytes
  const handleDownload = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const { PDFDocument, degrees } = window.PDFLib;
      const fileBytes = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBytes);
      const pages = pdfDoc.getPages();

      // Apply individual rotation modifications natively
      pagesData.forEach((pageState, idx) => {
        if (pageState.visualRotation !== 0) {
          const page = pages[idx];
          const existingRotation = page.getRotation().angle;
          page.setRotation(degrees(existingRotation + pageState.visualRotation));
        }
      });

      const rotatedBytes = await pdfDoc.save();
      const blob = new Blob([rotatedBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `edited_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to compile final rotation maps.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {/* Workspace Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>🔄 Interactive PDF Page Rotator</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Select specific pages to rotate visually before compiling.</p>
        </div>
        <button onClick={onBack} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Back</button>
      </div>

      {/* File Upload Zone */}
      <div style={{ border: '2px dashed #cbd5e1', padding: '30px', textAlign: 'center', borderRadius: '12px', backgroundColor: '#f8fafc', position: 'relative', marginBottom: '20px' }}>
        <p style={{ margin: 0, fontWeight: '500' }}>{file ? `📁 Active File: ${file.name}` : 'Drop or select PDF file to open interactive grid'}</p>
        <input type="file" accept=".pdf" onChange={handleFileChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
      </div>

      {loadingStatus && <p style={{ color: '#4f46e5', textAlign: 'center', fontWeight: '600' }}>⏳ {loadingStatus}</p>}

      {pagesData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px', marginTop: '20px' }}>
          
          {/* LEFT INTERACTIVE PREVIEW GRID */}
          <div>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '12px' }}>Click a page to select it:</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '20px', maxHeight: '450px', overflowY: 'auto', padding: '10px', backgroundColor: '#f1f5f9', borderRadius: '12px' }}>
              {pagesData.map((page, idx) => {
                const imgSrc = thumbnailContainerRef.current[page.pageNum];
                const isCurrent = selectedPage === idx;
                
                return (
                  <div 
                    key={page.pageNum}
                    onClick={() => setSelectedPage(idx)}
                    style={{
                      backgroundColor: '#fff',
                      padding: '10px',
                      borderRadius: '8px',
                      border: isCurrent ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      textAlign: 'center',
                      boxShadow: isCurrent ? '0 4px 12px rgba(79,70,229,0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                      transform: isCurrent ? 'scale(1.02)' : 'none',
                      transition: 'transform 0.1s, border-color 0.1s'
                    }}
                  >
                    <div style={{ position: 'relative', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                      {imgSrc ? (
                        <img 
                          src={imgSrc} 
                          alt={`page ${page.pageNum}`} 
                          style={{ 
                            maxHeight: '100%', 
                            maxWidth: '100%', 
                            transform: `rotate(${page.visualRotation}deg)`, 
                            transition: 'transform 0.2s ease-in-out' // Smooth visual rotation animation
                          }} 
                        />
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Loading...</span>
                      )}
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: '600', color: isCurrent ? '#4f46e5' : '#475569' }}>
                      Page {page.pageNum} {page.visualRotation > 0 && `(${page.visualRotation}°)`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT ACTION CONTROL CONSOLE */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', height: 'fit-content' }}>
            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '700' }}>Tool Controls</h4>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px 0', lineHeight: '1.4' }}>
                {selectedPage !== null 
                  ? `Currently modifying Page ${selectedPage + 1}. Click the button below to rotate it 90 degrees clockwise.`
                  : 'Select a page from the thumbnail panel to begin configuration.'
                }
              </p>

              <button 
                onClick={rotateSelectedPage}
                disabled={selectedPage === null}
                style={{
                  width: '100%',
                  backgroundColor: selectedPage === null ? '#cbd5e1' : '#fff',
                  color: selectedPage === null ? '#94a3b8' : '#1e293b',
                  border: '1px solid #cbd5e1',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: selectedPage === null ? 'not-allowed' : 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  marginBottom: '15px'
                }}
              >
                🔄 Rotate Selected Page (+90°)
              </button>
            </div>

            <button 
              onClick={handleDownload}
              disabled={isProcessing}
              style={{
                width: '100%',
                backgroundColor: '#4f46e5',
                color: '#fff',
                border: 'none',
                padding: '14px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
              }}
            >
              {isProcessing ? 'Compiling Modifications...' : '✨ Save Changes & Download'}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}