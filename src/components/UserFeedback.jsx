import React, { useEffect, useMemo, useState } from 'react';

import { FEEDBACK_STORAGE_KEY, readSubmissions, writeSubmissions } from '../lib/feedbackStorage';

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}


export default function UserFeedback({ onBack }) {
  const [feature, setFeature] = useState('');
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const [submissions, setSubmissions] = useState([]);
  const [submittedToast, setSubmittedToast] = useState('');

  const featureOptions = useMemo(
    () => [
      '',
      'Image to PDF',
      'Word to PDF',
      'PDF to Word',
      'Word to PPT',
      'Merge PDF',
      'Split / Extract Pages',
      'Compress PDF Size',
      'Rearrange PDF Grid',
      'Rotate PDF Pages',
      'Sign PDF Document',
      'Watermark PDF Stamp',
      'Metadata Sanitizer',
      'Password Protect PDF',
      'Run OCR Text Extractor',
      'PDF to Image',
      'Passport Photo Maker',
      'General / Overall app',
    ],
    []
  );

  useEffect(() => {
    setSubmissions(readSubmissions().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));

    const handleUpdate = () => {
      setSubmissions(
        readSubmissions().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      );
    };

    window.addEventListener('pdfy_feedback_added', handleUpdate);
    return () => window.removeEventListener('pdfy_feedback_added', handleUpdate);
  }, []);

  const validate = () => {
    if (!feature) return 'Please select which feature you’re giving feedback about.';
    if (!message.trim() || message.trim().length < 10)
      return 'Please write feedback (at least 10 characters).';
    if (rating < 1 || rating > 5) return 'Rating must be between 1 and 5.';
    if (email.trim()) {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
      if (!ok) return 'Email looks invalid.';
    }
    return '';
  };

  const submit = async (e) => {
    e.preventDefault();

    const err = validate();
    if (err) {
      setSubmittedToast(err);
      return;
    }

    const payload = {
      id: Math.random().toString(36).slice(2),
      feature,
      rating: clamp(Number(rating), 1, 5),
      message: message.trim(),
      email: email.trim() || '',
      createdAt: Date.now(),
    };

    // Always persist locally (so UX works even if backend is unavailable)
    const current = readSubmissions();
    const next = [...current, payload].slice(-100);
    writeSubmissions(next);
    window.dispatchEvent(new Event('pdfy_feedback_added'));

    // Best-effort backend capture
    let backendOk = false;
    try {
      const resp = await fetch('http://127.0.0.1:5001/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      backendOk = resp.ok;
    } catch {
      backendOk = false;
    }

    setFeature('');
    setRating(5);
    setMessage('');
    setEmail('');

    setSubmittedToast(
      backendOk
        ? 'Thanks! Your feedback has been saved (backend + local).'
        : 'Thanks! Your feedback has been saved locally on this device (backend unavailable).'
    );

    setTimeout(() => setSubmittedToast(''), 4500);

  };

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          gap: '12px',
        }}
      >
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
          🗣️ User Feedback & Review
        </h2>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ← Back
          </button>
        )}
      </div>

      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        }}
      >
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>
                Feature / Area
              </span>
              <select
                value={feature}
                onChange={(e) => setFeature(e.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#fff',
                  color: '#0f172a',
                  fontWeight: 600,
                }}
              >
                {featureOptions.map((opt) => (
                  <option key={opt} value={opt} disabled={opt === ''}>
                    {opt === '' ? 'Select…' : opt}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>
                Rating (1–5)
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
                <div
                  style={{
                    minWidth: '44px',
                    textAlign: 'center',
                    padding: '6px 10px',
                    borderRadius: '10px',
                    backgroundColor: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    fontWeight: 900,
                    color: '#3730a3',
                  }}
                >
                  {rating}★
                </div>
              </div>
            </label>
          </div>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>
              What should be improved or added?
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what’s not working, what you’d like added, or any update you want..."
              rows={5}
              style={{
                padding: '12px 12px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#fff',
                color: '#0f172a',
                fontWeight: 600,
                resize: 'vertical',
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569' }}>
              Email (optional)
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#fff',
                color: '#0f172a',
                fontWeight: 600,
              }}
            />
          </label>

          {submittedToast ? (
            <div
              role="status"
              style={{
                padding: '10px 12px',
                borderRadius: '12px',
                border: `1px solid ${submittedToast.startsWith('Thanks') ? '#93c5fd' : '#fca5a5'}`,
                backgroundColor: submittedToast.startsWith('Thanks') ? '#eff6ff' : '#fef2f2',
                color: submittedToast.startsWith('Thanks') ? '#1d4ed8' : '#b91c1c',
                fontWeight: 800,
                fontSize: '13px',
              }}
            >
              {submittedToast}
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="submit"
              style={{
                backgroundColor: '#4f46e5',
                border: '1px solid #4f46e5',
                color: '#ffffff',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 900,
              }}
            >
              Submit Feedback
            </button>

            <button
              type="button"
              onClick={() => {
                setFeature('');
                setRating(5);
                setMessage('');
                setEmail('');
                setSubmittedToast('');
              }}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 900,
              }}
            >
              Reset
            </button>

            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(FEEDBACK_STORAGE_KEY);
                setSubmissions([]);
                setSubmittedToast('Cleared local feedback submissions on this device.');
                setTimeout(() => setSubmittedToast(''), 3000);
              }}

              style={{
                marginLeft: 'auto',
                backgroundColor: '#fff',
                border: '1px solid #cbd5e1',
                color: '#64748b',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 900,
              }}
              title="Removes stored feedback from this browser only"
            >
              Clear Saved Reviews
            </button>
          </div>
        </form>
      </div>

      <div style={{ marginTop: '16px' }}>
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
            Recent Feedback (local)
          </h3>

          {submissions.length === 0 ? (
            <p style={{ margin: '10px 0 0', color: '#64748b', fontWeight: 700, fontSize: '13px' }}>
              No saved feedback yet. Submit one above.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
              {submissions
                .slice(0)
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                .slice(0, 12)
                .map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: '12px 12px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '13px' }}>
                          {s.feature}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '12px', fontWeight: 800, marginTop: '4px' }}>
                          {new Date(s.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div
                        style={{
                          padding: '6px 10px',
                          borderRadius: '12px',
                          backgroundColor: '#eef2ff',
                          border: '1px solid #c7d2fe',
                          fontWeight: 1000,
                          color: '#3730a3',
                          whiteSpace: 'nowrap',
                          height: 'fit-content',
                        }}
                      >
                        {s.rating}★
                      </div>
                    </div>

                    <div style={{ marginTop: '10px', color: '#334155', fontWeight: 700, fontSize: '13px' }}>
                      {s.message}
                    </div>

                    {s.email ? (
                      <div style={{ marginTop: '8px', color: '#94a3b8', fontWeight: 800, fontSize: '12px' }}>
                        Contact: {s.email}
                      </div>
                    ) : null}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

