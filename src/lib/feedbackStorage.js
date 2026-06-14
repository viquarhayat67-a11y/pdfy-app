export const FEEDBACK_STORAGE_KEY = 'pdfy_feedback_submissions';

export function readSubmissions() {
  const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function writeSubmissions(items) {
  localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(items));
}

