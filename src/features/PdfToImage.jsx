import React, { useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Native Vite Worker Configuration (Tells Vite to bundle the worker natively)
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export default function PdfToImage() {
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const canvasRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setImages([]);
      setProgress('');
    }
  };

  const convertPdfToImages = async () => {
    if (!file) return;
    setIsProcessing(true);
    setImages([]);

    try {
      const fileReader = new FileReader();
      fileReader.onload = async function () {
        try {
          const typedarray = new Uint8Array(this.result);
          
          // Load the document map
          const loadingTask = pdfjsLib.getDocument({
            data: typedarray,
            // Add safety configurations for smooth local parsing
            useSystemFonts: true,
            disableFontFace: false
          });
          
          const pdf = await loadingTask.promise;
          const totalPages = pdf.numPages;
          const extractedImages = [];

          for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            setProgress(`Converting page ${pageNum} of ${totalPages}...`);
            
            const page = await pdf.getPage(pageNum);
            
            // 1.5x scale offers an excellent balance between speed and crisp rendering
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
              canvasContext: context,
              viewport: viewport,
            };

            // Force vector compilation to the canvas memory stack
            await page.render(renderContext).promise;

            const imgUrl = canvas.toDataURL('image/png');
            extractedImages.push({
              page: pageNum,
              url: imgUrl
            });
          }

          setImages(extractedImages);
          setProgress('✨ Extraction Successful!');
        } catch (innerError) {
          console.error("Worker parsing error:", innerError);
          setProgress(`⚠️ Canvas compilation error: ${innerError.message}`);
        } finally {
          setIsProcessing(false);
        }
      };

      fileReader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("File reading framework error:", err);
      setProgress('⚠️ Could not open target file structure.');
      setIsProcessing(false);
    }
  };

  const downloadAllImages = () => {
    images.forEach((img) => {
      const link = document.createElement('a');
      link.href = img.url;
      link.download = `${file.name.replace('.pdf', '')}_page_${img.page}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>🖼️ Convert PDF to Images</h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Extracts every page into a crisp, high-resolution PNG image entirely inside your browser.</p>
      </div>

      <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '40px', textAlign: 'center', backgroundColor: '#f8fafc', marginBottom: '20px' }}>
        <input type="file" accept=".pdf" onChange={handleFileChange} id="pdf-to-img-picker" style={{ display: 'none' }} />
        <label htmlFor="pdf-to-img-picker" style={{ cursor: 'pointer', display: 'block' }}>
          <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>📄</span>
          <span style={{ fontWeight: '600', color: '#2563eb', display: 'block', fontSize: '16px' }}>{file ? file.name : 'Click to select open PDF file'}</span>
          <span style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px', display: 'block' }}>Works instantly on local file arrays</span>
        </label>
      </div>

      {file && !isProcessing && images.length === 0 && (
        <button onClick={convertPdfToImages} style={{ width: '100%', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '15px' }}>
          Extract Pages as Images
        </button>
      )}

      {progress && (
        <div style={{ padding: '12px', backgroundColor: '#eff6ff', color: '#1e40af', borderRadius: '8px', fontSize: '14px', fontWeight: '500', textAlign: 'center', margin: '15px 0' }}>
          {progress}
        </div>
      )}

      {images.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e293b' }}>Extracted Workspace Grid Pages</h3>
            <button onClick={downloadAllImages} style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>
              Download All Images
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '20px' }}>
            {images.map((img) => (
              <div key={img.page} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', backgroundColor: '#fff', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <img src={img.url} alt={`Page ${img.page}`} style={{ width: '100%', borderRadius: '4px', border: '1px solid #f1f5f9', marginBottom: '8px' }} />
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Page {img.page}</div>
                <a href={img.url} download={`page_${img.page}.png`} style={{ display: 'inline-block', marginTop: '6px', fontSize: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>Download Single</a>
              </div>
            ))}
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}