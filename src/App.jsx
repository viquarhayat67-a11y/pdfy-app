import React, { useState, useEffect } from 'react';

// ALL ACTIVE UTILITIES
import ImageToPdf from './features/ImageToPdf';
import OcrEngine from './features/OcrEngine';
import WordToPdf from './features/WordToPdf';
import PdfToWord from './features/PdfToWord';
import WordToPpt from './features/WordToPpt';
import MergePdf from './features/MergePdf';
import RotatePdf from './features/RotatePdf';
import SignPdf from './features/SignPdf';
import SplitPdf from './features/SplitPdf'; 
import WatermarkPdf from './features/WatermarkPdf'; 
import MetadataPdf from './features/MetadataPdf';
import CompressPdf from './features/CompressPdf';
import ReorderPdf from './features/ReorderPdf';
import HistoryLog from './components/HistoryLog';
import ProtectPdf from './features/ProtectPdf';
import PdfToImage from './features/PdfToImage';
import PassportPhotoMaker from './features/PassportPhotoMaker';


const useScript = (url) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [url]);
  return loaded;
};

export default function App() {
  const pakoLoaded = useScript('https://cdnjs.cloudflare.com/ajax/libs/pako/2.1.0/pako.min.js');
  const jsPdfLoaded = useScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  const tesseractLoaded = useScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/dist/tesseract.min.js');
  const mammothLoaded = useScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
  const pptxGenLoaded = useScript('https://cdn.jsdelivr.net/gh/gitbrent/PptxGenJS@3.12.0/dist/pptxgen.bundle.js');
  const pdfJsLoaded = useScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js');
  const pdfLibLoaded = useScript('https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js');

  const [activeTool, setActiveTool] = useState(null);

  useEffect(() => {
    if (activeTool) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTool]);

  // REGISTERED MASTER DASHBOARD DIRECTORY
  const tools = [
    { id: 'imgToPdf', category: 'Conversions', name: 'Image to PDF', icon: '🖼️', desc: 'Convert multiple images into a single combined PDF document.' },
    { id: 'wordToPdf', category: 'Conversions', name: 'Word to PDF', icon: '📄', desc: 'Transform native .docx structures into standard web PDFs.' },
    { id: 'pdfToWord', category: 'Conversions', name: 'PDF to Word', icon: '📝', desc: 'Extract clean structural text vectors back out into Word files.' },
    { id: 'wordToPpt', category: 'Conversions', name: 'Word to PPT', icon: '📊', desc: 'Compile document outlines into presentation slides automatically.' },
    { id: 'merge', category: 'Page Modifiers', name: 'Merge PDF Documents', icon: '🥞', desc: 'Stitch multiple PDF documents into a unified file structure.' },
    { id: 'split', category: 'Page Modifiers', name: 'Split / Extract Pages', icon: '✂️', desc: 'Extract specific page number selections into a new document.' },
    { id: 'compress', category: 'Page Modifiers', name: 'Compress PDF Size', icon: '🗜️', desc: 'Downsize file byte footings by optimizing object stream trees.' },
    { id: 'reorder', category: 'Page Modifiers', name: 'Rearrange PDF Grid', icon: '🧩', desc: 'Visually shift, delete, or shuffle document layouts cleanly.' },
    { id: 'rotate', category: 'Page Modifiers', name: 'Rotate PDF Pages', icon: '🔄', desc: 'Fix page orientations for skewed or upside-down document scans visually.' },
    { id: 'sign', category: 'Security & Integrity', name: 'Sign PDF Document', icon: '✍️', desc: 'Draw custom electronic signatures and stamp them onto page pages.' },
    { id: 'watermark', category: 'Security & Integrity', name: 'Watermark PDF Stamp', icon: '🛡️', desc: 'Apply translucent text protection banners over document pages.' },
    { id: 'metadata', category: 'Security & Integrity', name: 'Metadata Sanitizer', icon: '🏷️', desc: 'Inspect, rewrite, or completely wipe tracking properties from files.' },
    { id: 'protect', category: 'Security & Integrity', name: 'Password Protect PDF', icon: '🔒', desc: 'Encrypt documents with user-defined passwords and permission locks.' }, 
    { id: 'ocr', category: 'Security & Integrity', name: 'Run OCR Text Extractor', icon: '🔍', desc: 'Extract editable text character data from flattened image assets.' },
    { id: 'pdfToImage', category: 'Conversions', name: 'PDF to Image', icon: '📸', desc: 'Convert each page of a PDF document into high-quality image files.' },
    { id: 'passportPhoto', category: 'Conversions', name: 'Passport Photo Maker', icon: '🛂', desc: 'Create compliant passport photos with automatic face detection and cropping.' },
  ];

  const categories = ['Conversions', 'Page Modifiers', 'Security & Integrity'];

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', color: '#1e293b' }}>
      <nav style={{ padding: '16px 40px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', fontWeight: '700', fontSize: '20px', color: '#4f46e5' }}>
        ⚡ PDFy Suite Studio Pro
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        
        {/* Dynamic Workspace Processing Router Box */}
        
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', padding: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '40px' }}>
          {activeTool === 'imgToPdf' ? (
            <ImageToPdf jsPdfLoaded={jsPdfLoaded} onBack={() => setActiveTool(null)} />
          ) : activeTool === 'ocr' ? (
            <OcrEngine tesseractLoaded={tesseractLoaded} onBack={() => setActiveTool(null)} />
          ) : activeTool === 'wordToPdf' ? (
            <WordToPdf mammothLoaded={mammothLoaded} jsPdfLoaded={jsPdfLoaded} onBack={() => setActiveTool(null)} />
          ) : activeTool === 'pdfToWord' ? (
            <PdfToWord pdfJsLoaded={pdfJsLoaded} onBack={() => setActiveTool(null)} />
          ) : activeTool === 'wordToPpt' ? (
            <WordToPpt pptxGenLoaded={pptxGenLoaded} mammothLoaded={mammothLoaded} onBack={() => setActiveTool(null)} />
          ) : activeTool === 'merge' ? (
            <MergePdf pdfLibLoaded={pdfLibLoaded} onBack={() => setActiveTool(null)} />
          ) : activeTool === 'split' ? (
            <SplitPdf pdfLibLoaded={pdfLibLoaded} onBack={() => setActiveTool(null)} />
          ) : activeTool === 'rotate' ? (
            <RotatePdf pdfJsLoaded={pdfJsLoaded} pdfLibLoaded={pdfLibLoaded} onBack={() => setActiveTool(null)} />
          ) : activeTool === 'sign' ? (
            <SignPdf pdfLibLoaded={pdfLibLoaded} onBack={() => setActiveTool(null)} />
          ) : activeTool === 'watermark' ? (
            <WatermarkPdf pdfLibLoaded={pdfLibLoaded} onBack={() => setActiveTool(null)} />
          ) : activeTool === 'passportPhoto' ? (
            <PassportPhotoMaker onBack={() => setActiveTool(null)} />
          ) : activeTool === 'reorder' ? (
            <ReorderPdf pdfJsLoaded={pdfJsLoaded} pdfLibLoaded={pdfLibLoaded} onBack={() => setActiveTool(null)} />
          ) : activeTool === 'compress' ? (
            <CompressPdf  pdfLibLoaded={pdfLibLoaded} onBack={() => setActiveTool(null)} />
          ) : activeTool === 'pdfToImage' ? (
            <PdfToImage pdfJsLoaded={pdfJsLoaded} onBack={() => setActiveTool(null)} />
          ) :activeTool === 'protect' ? (
            <ProtectPdf pdfLibLoaded={pdfLibLoaded} onBack={() => setActiveTool(null)} />
           ) :activeTool === 'metadata' ? (
            <MetadataPdf onBack={() => setActiveTool(null)} /> 
          ) :(
            <div style={{ color: '#64748b', textAlign: 'center' }}>
              <h3 style={{ fontSize: '17px', color: '#334155', margin: 0, fontWeight: '600' }}>Select a utility from the list below to launch a processing workshop.</h3>
            </div>
          )}
        </div>

        {/* Dashboard Cards Grid UI */}
        {categories.map((cat) => (
          <div key={cat} style={{ marginBottom: '40px' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#475569', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{cat}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
              {tools.filter(t => t.category === cat).map((tool) => (
                <div 
                  key={tool.id} 
                  onClick={() => setActiveTool(tool.id)}
                  style={{ backgroundColor: '#ffffff', padding: '22px', borderRadius: '14px', border: activeTool === tool.id ? '2px solid #4f46e5' : '1px solid #e2e8f0', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>{tool.icon}</div>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>{tool.name}</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.45' }}>{tool.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        <HistoryLog />
      </main>
    </div>
  );
}
