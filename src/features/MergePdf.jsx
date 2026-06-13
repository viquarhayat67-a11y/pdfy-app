import React, { useState } from 'react';
import { addHistoryLog } from '../components/HistoryLog';

export default function MergePdf({ pdfLibLoaded, onBack }) {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validPdfs = selectedFiles.filter(file => file.type === 'application/pdf');
    
    setFiles(prev => [...prev, ...validPdfs.map(file => ({
      id: Math.random().toString(),
      name: file.name,
      fileObj: file
    }))]);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const moveFile = (index, direction) => {
    const updated = [...files];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    
    // Swap items in array to alter merge order sequence
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setFiles(updated);
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);

    try {
      const { PDFDocument } = window.PDFLib;
      const mergedPdf = await PDFDocument.create();

      for (const fileObj of files) {
        const fileBytes = await fileObj.fileObj.arrayBuffer();
        const srcPdf = await PDFDocument.load(fileBytes);
        const copiedPages = await mergedPdf.copyPages(srcPdf, srcPdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      addHistoryLog('PDF Merger', `${files.length} Files`, '🔗', `Merged`);
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = "merged_document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(error);
      alert("An error occurred while merging your PDF streams. Files might be corrupted or restricted.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>🥞 Local PDF Merger Panel</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Stitch multiple documents together sequentially inside sandbox browser memory.</p>
        </div>
        <button onClick={onBack} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Back</button>
      </div>

      <div style={{ border: '2px dashed #cbd5e1', padding: '30px', textAlign: 'center', borderRadius: '12px', backgroundColor: '#f8fafc', position: 'relative', marginBottom: '20px' }}>
        <p style={{ margin: 0 }}>Select or Drop multiple PDF files to combine</p>
        <input type="file" multiple accept=".pdf" onChange={handleFileChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
      </div>

      {files.length > 0 && (
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {files.map((file, idx) => (
              <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{idx + 1}. {file.name}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => moveFile(idx, -1)} disabled={idx === 0} style={{ padding: '4px 8px', cursor: 'pointer' }}>▲</button>
                  <button onClick={() => moveFile(idx, 1)} disabled={idx === files.length - 1} style={{ padding: '4px 8px', cursor: 'pointer' }}>▼</button>
                  <button onClick={() => removeFile(file.id)} style={{ padding: '4px 8px', color: '#fff', backgroundColor: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleMerge} disabled={files.length < 2 || isProcessing} style={{ backgroundColor: files.length < 2 ? '#94a3b8' : '#4f46e5', color: '#fff', border: 'none', width: '100%', padding: '14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
            {isProcessing ? "Combining streams..." : `🥞 Merge ${files.length} PDF Documents`}
          </button>
        </div>
      )}
    </div>
  );
}