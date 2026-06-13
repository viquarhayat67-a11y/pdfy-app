import React, { useState } from 'react';
import { addHistoryLog } from '../components/HistoryLog';

export default function SplitPdf({ pdfLibLoaded, onBack }) {
  const [file, setFile] = useState(null);
  const [pageRange, setPageRange] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfDoc = await window.PDFLib.PDFDocument.load(arrayBuffer);
        setTotalPages(pdfDoc.getPageCount());
      } catch (err) {
        alert("Could not parse PDF page dimensions.");
      }
    }
  };

  // Helper to parse strings like "1, 3-5, 7" into an array of page numbers [1, 3, 4, 5, 7]
  const parsePageRange = (rangeStr, maxPages) => {
    const pages = new Set();
    const tokens = rangeStr.split(',');

    for (let token of tokens) {
      token = token.trim();
      if (token.includes('-')) {
        const [start, end] = token.split('-').map(num => parseInt(num.trim(), 10));
        if (start && end && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i >= 1 && i <= maxPages) pages.add(i);
          }
        }
      } else {
        const num = parseInt(token, 10);
        if (num >= 1 && num <= maxPages) pages.add(num);
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  const handleSplit = async () => {
    if (!file || !pageRange) return;
    setIsProcessing(true);

    try {
      const targetPages = parsePageRange(pageRange, totalPages);
      if (targetPages.length === 0) {
        alert("Please enter a valid page range matching the document size.");
        setIsProcessing(false);
        return;
      }

      const { PDFDocument } = window.PDFLib;
      const srcBytes = await file.arrayBuffer();
      const srcPdf = await PDFDocument.load(srcBytes);
      const newPdf = await PDFDocument.create();

      // pdf-lib uses 0-indexed arrays, so convert page numbers (1-based) to indices
      const pageIndices = targetPages.map(p => p - 1);
      const copiedPages = await newPdf.copyPages(srcPdf, pageIndices);
      copiedPages.forEach(page => newPdf.addPage(page));

      const newPdfBytes = await newPdf.save();
      const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
      addHistoryLog('Page Splitter', file.name, '✂️', `Pages: ${pageSelection}`);
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `extracted_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Extraction process failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>✂️ PDF Page Extractor / Splitter</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Carve out and download a custom selection of pages into a new file.</p>
        </div>
        <button onClick={onBack} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Back</button>
      </div>

      <div style={{ border: '2px dashed #cbd5e1', padding: '30px', textAlign: 'center', borderRadius: '12px', backgroundColor: '#f8fafc', position: 'relative', marginBottom: '20px' }}>
        <span>✂️</span>
        <h4>{file ? file.name : 'Select PDF document to extract pages from'}</h4>
        <input type="file" accept=".pdf" onChange={handleFileChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
      </div>

      {file && (
        <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#475569' }}>📈 Total Document Length: <strong>{totalPages} Pages</strong></p>
          
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#1e293b' }}>Enter Page Selection:</label>
          <input 
            type="text" 
            placeholder="e.g. 1, 3-5, 7" 
            value={pageRange}
            onChange={(e) => setPageRange(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', marginBottom: '15px' }}
          />
          <p style={{ margin: '0 0 20px 0', fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>Separate pages with commas, or define chunks using blocks (e.g. 2-6).</p>

          <button onClick={handleSplit} disabled={isProcessing || !pageRange} style={{ width: '100%', backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
            {isProcessing ? "Isolating content streams..." : "✨ Extract & Download Pages"}
          </button>
        </div>
      )}
    </div>
  );
}