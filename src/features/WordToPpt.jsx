import React, { useState } from 'react';

export default function WordToPpt({ pptxGenLoaded, mammothLoaded, onBack }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.docx')) {
      setFile(selectedFile);
    }
  };

  const handlePresentationCompile = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        const arrayBuffer = e.target.result;
        
        // Parse raw text out of the Word container
        const result = await window.mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        const textLines = result.value.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        // Start presentation compiler
        const pptx = new window.PptxGenJS();
        
        // 1. Create a clean Title Slide
        let titleSlide = pptx.addSlide();
        titleSlide.addText(file.name.replace('.docx', ''), { x: 1, y: 2.2, w: 8, h: 1, fontSize: 28, bold: true, color: '4F46E5', align: 'center' });
        titleSlide.addText('Document Presentation Summary', { x: 1, y: 3.2, w: 8, h: 0.5, fontSize: 14, color: '64748B', align: 'center' });

        // 2. SMART CHUNKING: Group individual lines into clean text block paragraphs
        let currentSlideParagraphs = [];
        let currentCharacterCount = 0;

        for (let i = 0; i < textLines.length; i++) {
          const currentLine = textLines[i];
          
          currentSlideParagraphs.push(currentLine);
          currentCharacterCount += currentLine.length;

          // If we have accumulated 4 lines OR reached 300 characters, package them into a slide!
          if (currentSlideParagraphs.length >= 4 || currentCharacterCount >= 300 || i === textLines.length - 1) {
            let bodySlide = pptx.addSlide();
            
            // Combine grouped lines using clean spacing breaks
            const slideBodyText = currentSlideParagraphs.join('\n\n');
            
            bodySlide.addText(slideBodyText, { 
              x: 0.8, 
              y: 0.8, 
              w: 8.4, 
              h: 4.0, 
              fontSize: 15, 
              color: '1E293B', 
              valign: 'top',
              lineSpacing: 24 
            });

            // Reset trackers for the next presentation slide container
            currentSlideParagraphs = [];
            currentCharacterCount = 0;
          }
        }

        // Trigger native file system download
        pptx.writeFile({ fileName: `${file.name.replace('.docx', '')}_Presentation` });
        setIsProcessing(false);
      };
      fileReader.readAsArrayBuffer(file);
    } catch (err) {
      alert("Encountered errors compiling slide presentation layout patterns.");
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>📊 Local Word to PPT Deck Builder</h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Groups document summaries into multi-line presentation slides intelligently.</p>
        </div>
        <button onClick={onBack} style={{ backgroundColor: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Back</button>
      </div>

      <div style={{ border: '2px dashed #cbd5e1', padding: '40px 20px', textAlign: 'center', borderRadius: '12px', backgroundColor: '#f8fafc', position: 'relative' }}>
        <span>📊</span>
        <h4>{file ? file.name : 'Select Word Document (.docx)'}</h4>
        <input type="file" accept=".docx" onChange={handleFileChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
      </div>
      {file && !isProcessing && (
        <button onClick={handlePresentationCompile} style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', width: '100%', fontWeight: '600', marginTop: '15px', cursor: 'pointer' }}>
          🚀 Build & Download Presentation Deck
        </button>
      )}
      {isProcessing && <p style={{ textAlign: 'center', color: '#4f46e5', fontWeight: '600', marginTop: '15px' }}>Structuring content blocks into slides...</p>}
    </div>
  );
}