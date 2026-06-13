import React, { useState } from 'react';

export default function PdfToWord({ pdfJsLoaded, onBack }) {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setExtractedText('');
    }
  };

  const handleDeconstruct = async () => {
    if (!file) return;
    setIsProcessing(true);
    setExtractedText('Opening document data stream...');

    try {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          
          // Access the globally loaded mozilla pdfjsLib instance
          const pdfjsLib = window['pdfjs-dist/build/pdf'];
          
          // Map the background processing thread script worker path
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

          // Load document data array
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          
          let fullDocumentText = '';

          // Loop over every page in the PDF document sequentially
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            setExtractedText(`Processing character arrays: page ${pageNum} of ${pdf.numPages}...`);
            
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            // Map token strings and merge layout spacing breaks
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullDocumentText += `[Page ${pageNum}]\n${pageText}\n\n`;
          }

          if (!fullDocumentText.trim()) {
            fullDocumentText = "This PDF seems to be an image-only scan. Try running it through your OCR panel to pull text elements!";
          }

          setExtractedText(fullDocumentText);

          // Package the actual pulled text elements directly into a downloadable word layout file
          const blob = new Blob([fullDocumentText], { type: 'application/msword;charset=utf-8' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${file.name.replace('.pdf', '')}.doc`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setIsProcessing(false);
        } catch (err) {
          console.error(err);
          setExtractedText("Failed to deconstruct target document file layer objects.");
          setIsProcessing(false);
        }
      };
      fileReader.readAsArrayBuffer(file);
    } catch (err) {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>📝 Local PDF to Word Extractor</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Deconstruct PDF documents into editable Word file formats safely.</p>
        </div>
        <button onClick={onBack} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Back</button>
      </div>

      {!pdfJsLoaded ? (
        <div style={{ padding: '15px', backgroundColor: '#fef3c7', color: '#b45309', borderRadius: '8px', fontSize: '14px' }}>
          ⏳ Syncing deep-parsing document compilation core utilities from network CDN...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: file ? '1fr 1fr' : '1fr', gap: '20px' }}>
          <div>
            <div style={{ border: '2px dashed #cbd5e1', padding: '40px 20px', textAlign: 'center', borderRadius: '12px', backgroundColor: '#f8fafc', position: 'relative', marginBottom: '15px' }}>
              <span style={{ fontSize: '32px' }}>📄</span>
              <h4 style={{ margin: '8px 0 0 0' }}>{file ? file.name : 'Select PDF to Extract'}</h4>
              <input type="file" accept=".pdf" onChange={handleFileChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            </div>
            {file && !isProcessing && <button onClick={handleDeconstruct} style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', width: '100%', fontWeight: '600', cursor: 'pointer' }}>✨ Extract & Convert to Word</button>}
          </div>
          {extractedText && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', marginBottom: '6px' }}>Extracted Document Live Preview Container:</span>
              <textarea readOnly value={extractedText} style={{ minHeight: '220px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '12px', backgroundColor: '#fafafa', resize: 'none' }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}