import React, { useState, useRef } from 'react';
import { addHistoryLog } from '../components/HistoryLog';

export default function ReorderPdf({ pdfJsLoaded, pdfLibLoaded, onBack }) {
  const [file, setFile] = useState(null);
  const [pagesList, setPagesList] = useState([]); // Array of { id, originalPageNum }
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');
  const thumbnailsMapRef = useRef({});

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setPagesList([]);
      thumbnailsMapRef.current = {};
      generateGridLayout(selectedFile);
    }
  };

  // Extract page layers via pdf.js and draw onto hidden workspace canvas tiles
  const generateGridLayout = async (targetFile) => {
    setLoadingStatus('Parsing document index trees and drawing page sheets...');
    try {
      const arrayBuffer = await targetFile.arrayBuffer();
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const initialOrder = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        initialOrder.push({ id: Math.random().toString(), originalPageNum: i });
      }
      setPagesList(initialOrder);

      // Async fetch page bitmaps into canvas cache pool
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.25 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport: viewport }).promise;
        thumbnailsMapRef.current[i] = canvas.toDataURL();
        
        // Force re-render as individual thumbnails arrive dynamically
        setPagesList(prev => [...prev]);
      }
      setLoadingStatus('');
    } catch (err) {
      console.error(err);
      setLoadingStatus('Failed to generate visual layout grid.');
    }
  };

  // Shift items left or right inside the layout array
  const shiftPagePosition = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= pagesList.length) return;
    
    const updated = [...pagesList];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setPagesList(updated);
  };

  // Remove a page slot out of the final download pipeline arrays
  const dropPageFromStream = (id) => {
    setPagesList(prev => prev.filter(p => p.id !== id));
  };

  const handleCompileOrder = async () => {
    if (!file || pagesList.length === 0) return;
    setIsProcessing(true);

    try {
      const { PDFDocument } = window.PDFLib;
      const fileBytes = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(fileBytes);
      const outputPdf = await PDFDocument.create();

      // Convert our 1-based human page indices back into 0-indexed byte addresses
      const selectedIndices = pagesList.map(p => p.originalPageNum - 1);
      
      // Copy and slide compiled blocks into the fresh file pool sequence
      const copiedPages = await outputPdf.copyPages(srcPdf, selectedIndices);
      copiedPages.forEach(page => outputPdf.addPage(page));

      const savedBytes = await outputPdf.save();
      const blob = new Blob([savedBytes], { type: 'application/pdf' });
      addHistoryLog('Grid Rearranger', file.name, '🧩', `${pagesList.length} pgs reordered`);
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `rearranged_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Error compiling custom page matrix structures.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>🧩 Visual Page Organizer Grid</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Shift, delete, or re-order document page matrices instantly in safe sandboxed browser frames.</p>
        </div>
        <button onClick={onBack} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Back</button>
      </div>

      <div style={{ border: '2px dashed #cbd5e1', padding: '30px', textAlign: 'center', borderRadius: '12px', backgroundColor: '#f8fafc', position: 'relative', marginBottom: '20px' }}>
        <p style={{ margin: 0, fontWeight: '500' }}>{file ? `📁 Loaded Document: ${file.name}` : 'Drop or select PDF file to spawn visual array grid'}</p>
        <input type="file" accept=".pdf" onChange={handleFileChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
      </div>

      {loadingStatus && <p style={{ color: '#4f46e5', textAlign: 'center', fontWeight: '600' }}>⏳ {loadingStatus}</p>}

      {pagesList.length > 0 && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '20px', backgroundColor: '#f1f5f9', padding: '20px', borderRadius: '12px', maxHeight: '420px', overflowY: 'auto', marginBottom: '25px' }}>
            {pagesList.map((page, idx) => {
              const previewSrc = thumbnailsMapRef.current[page.originalPageNum];
              return (
                <div key={page.id} style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', overflow: 'hidden', border: '1px solid #f1f5f9', borderRadius: '4px' }}>
                    {previewSrc ? (
                      <img src={previewSrc} alt={`idx-${idx}`} style={{ maxHeight: '100%', maxWidth: '100%' }} />
                    ) : (
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Loading...</span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b', marginTop: '8px' }}>
                    Slot {idx + 1} <span style={{ fontWeight: '400', fontSize: '11px', color: '#64748b' }}>(Orig: #{page.originalPageNum})</span>
                  </div>
                  
                  {/* Action Keys */}
                  <div style={{ display: 'flex', gap: '4px', marginTop: '10px', justifyContent: 'center' }}>
                    <button onClick={() => shiftPagePosition(idx, -1)} disabled={idx === 0} style={{ padding: '4px 6px', fontSize: '11px', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}>◀</button>
                    <button onClick={() => shiftPagePosition(idx, 1)} disabled={idx === pagesList.length - 1} style={{ padding: '4px 6px', fontSize: '11px', cursor: idx === pagesList.length - 1 ? 'not-allowed' : 'pointer' }}>▶</button>
                    <button onClick={() => dropPageFromStream(page.id)} style={{ padding: '4px 6px', fontSize: '11px', color: '#fff', backgroundColor: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={handleCompileOrder} disabled={isProcessing} style={{ width: '100%', backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '15px', borderRadius: '10px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(79,70,229,0.2)' }}>
            {isProcessing ? "Re-wiring document streams..." : "🚀 Compile Reordered Layout & Download"}
          </button>
        </div>
      )}
    </div>
  );
}