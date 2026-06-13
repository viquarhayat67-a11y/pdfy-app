import React, { useState } from 'react';

export default function ProtectPdf({ onBack }) {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setErrorMessage('');
      setSuccessMessage('');
    } else {
      setErrorMessage('Please select a valid PDF file.');
    }
  };

  const handleProtectDoc = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!file) return setErrorMessage('Please upload a PDF file first.');
    if (!password) return setErrorMessage('Password field cannot be blank.');
    if (password !== confirmPassword) return setErrorMessage('Passwords do not match.');

    setIsProcessing(true);

    // Formulate a standardized multi-part payload stream
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);

    try {
      // Connect to our local micro-service running on port 5001
      const response = await fetch('http://127.0.0.1:5001/api/protect', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Server error applying protection schemes.');
      }

      // Convert incoming response stream back to download blob link
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${file.name.replace('.pdf', '')}_locked.pdf`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      setSuccessMessage('🔒 PDF natively encrypted and downloaded successfully! Testing password locks is ready.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Could not establish connection to security micro-service API layers.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>🔒 Protect PDF (Native Engine)</h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Pipes file streams locally through an integrated QPDF security handler micro-service framework.</p>
      </div>

      <form onSubmit={handleProtectDoc} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '30px', textAlign: 'center', backgroundColor: '#f8fafc' }}>
          <input type="file" accept=".pdf" onChange={handleFileChange} id="pdf-secure-selector" style={{ display: 'none' }} />
          <label htmlFor="pdf-secure-selector" style={{ cursor: 'pointer', display: 'block' }}>
            <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>📄</span>
            <span style={{ fontWeight: '600', color: '#4f46e5', display: 'block' }}>{file ? file.name : 'Select or drop PDF document'}</span>
            <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>{file ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : 'Pipes through isolated local port structures'}</span>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '6px' }}>Set Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" disabled={isProcessing} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '6px' }}>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" disabled={isProcessing} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' }} />
          </div>
        </div>

        {errorMessage && <div style={{ padding: '12px', backgroundColor: '#fef2f2', color: '#b91c1c', borderRadius: '8px', fontSize: '13px', fontWeight: '500' }}>⚠️ {errorMessage}</div>}
        {successMessage && <div style={{ padding: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', borderRadius: '8px', fontSize: '13px', fontWeight: '500' }}>{successMessage}</div>}

        <button type="submit" disabled={isProcessing || !file} style={{ width: '100%', backgroundColor: !file ? '#94a3b8' : '#4f46e5', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: !file ? 'not-allowed' : 'pointer' }}>
          {isProcessing ? '⚙️ Processing Cryptographic Stream Elements...' : 'Lock & Download Protected PDF'}
        </button>
      </form>
    </div>
  );
}