import React, { useState, useEffect, useRef } from 'react';
import { addHistoryLog } from '../components/HistoryLog';

export default function CompressPdf({ onBack }) {
  const [file, setFile] = useState(null);
  const [originalSize, setOriginalSize] = useState('');
  const [compressedSize, setCompressedSize] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionStatus, setCompressionStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false); // Tracks visual hover state
  
  const workerRef = useRef(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('../pdf.worker.js', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (e) => {
      const { status, success, resultBuffer, error } = e.data;
      if (status) setCompressionStatus(status);

      if (success && resultBuffer) {
        const finalBlob = new Blob([resultBuffer], { type: 'application/pdf' });
        setCompressedSize(formatBytes(finalBlob.size));
        setCompressionStatus(`✅ Success! Background thread compression complete.`);
        setIsProcessing(false);

        addHistoryLog('Compressor', file.name, '⚡', `${formatBytes(file.size)} ➔ ${formatBytes(finalBlob.size)}`);

        const link = document.createElement('a');
        link.href = URL.createObjectURL(finalBlob);
        link.download = `worker_optimized_${file.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      if (success === false) {
        setCompressionStatus(`❌ Thread crash: ${error}`);
        setIsProcessing(false);
      }
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, [file]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Drag and Drop Event Interceptors
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true); // Engages highlighted style borders
  };

  const handleDragLeave = () => {
    setIsDragging(false); // Restores baseline state
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      processSelectedFile(droppedFile);
    } else {
      alert("Please drop a valid PDF document resource.");
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      processSelectedFile(selectedFile);
    }
  };

  const processSelectedFile = (targetFile) => {
    setFile(targetFile);
    setOriginalSize(formatBytes(targetFile.size));
    setCompressedSize('');
    setCompressionStatus('');
  };

  const handleWorkerCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    setCompressionStatus('🚀 Offloading file bytes to background Web Worker thread...');

    const arrayBuffer = await file.arrayBuffer();
    workerRef.current.postMessage({
      action: 'compress',
      fileBuffer: arrayBuffer
    }, [arrayBuffer]);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>⚡ Web Worker PDF Compressor</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Runs optimization scripts on a background thread to keep the main UI responsive.</p>
        </div>
        <button onClick={onBack} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Back</button>
      </div>

      {/* Interactive Drag & Drop Box Area Container */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ 
          border: isDragging ? '2px dashed #4f46e5' : '2px dashed #cbd5e1', 
          padding: '40px 20px', 
          textAlign: 'center', 
          borderRadius: '12px', 
          backgroundColor: isDragging ? '#eef2ff' : '#f8fafc', 
          position: 'relative', 
          marginBottom: '20px',
          transition: 'all 0.15s ease-in-out'
        }}
      >
        <span style={{ fontSize: '32px' }}>{isDragging ? '📥' : '⚡'}</span>
        <h4 style={{ margin: '8px 0 0 0', color: isDragging ? '#4f46e5' : '#1e293b' }}>
          {file ? file.name : 'Drag & drop PDF here or click to browse'}
        </h4>
        <input 
          type="file" 
          accept=".pdf" 
          onChange={handleFileChange} 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} 
        />
      </div>

      {file && (
        <div style={{ maxWidth: '500px', margin: '0 auto', padding: '25px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '25px', borderBottom: '1px solid #e2e8f0', paddingBottom: '15px' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Original Size</span>
              <strong style={{ fontSize: '18px', color: '#334155' }}>{originalSize}</strong>
            </div>
            {compressedSize && (
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#22c55e', display: 'block', textTransform: 'uppercase' }}>Worker Output</span>
                <strong style={{ fontSize: '18px', color: '#16a34a' }}>{compressedSize}</strong>
              </div>
            )}
          </div>

          <button onClick={handleWorkerCompress} disabled={isProcessing} style={{ width: '100%', backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
            {isProcessing ? "Processing in background thread..." : "🚀 Launch Background Thread Compression"}
          </button>

          {compressionStatus && (
            <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#1e293b', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace', color: '#38bdf8', lineHeight: '1.4', borderLeft: '3px solid #38bdf8' }}>
              {compressionStatus}
            </div>
          )}
        </div>
      )}
    </div>
  );
}