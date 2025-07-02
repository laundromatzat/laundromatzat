import React, { useEffect, useState } from 'react';
import { GoogleGenAI } from '@google/genai';

// Emails of users allowed to access the tool. Replace with real admin-managed list.
const APPROVED_USERS = [
  'admin@example.com'
];

interface VisitParams {
  patientAge: string;
  patientSex: string;
  chiefComplaint: string;
  history: string;
  exam: string;
  assessment: string;
  plan: string;
}

function decodeJwt(token: string): any {
  const payload = token.split('.')[1];
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const decoded = atob(base64);
  return JSON.parse(decoded);
}

export default function SpecialPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [approved, setApproved] = useState(false);
  const [params, setParams] = useState<VisitParams>({
    patientAge: '',
    patientSex: '',
    chiefComplaint: '',
    history: '',
    exam: '',
    assessment: '',
    plan: ''
  });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load Google Identity script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      // @ts-ignore
      if (window.google && window.google.accounts && window.google.accounts.id) {
        // @ts-ignore
        window.google.accounts.id.initialize({
          client_id: (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
          callback: (response: any) => {
            const payload = decodeJwt(response.credential);
            const email = payload.email;
            setUserEmail(email);
            setApproved(APPROVED_USERS.includes(email));
          }
        });
        // @ts-ignore
        window.google.accounts.id.renderButton(
          document.getElementById('g_id_signin'),
          { theme: 'outline', size: 'large' }
        );
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setParams(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.GEMINI_API_KEY });
    const model = ai.getGenerativeModel({ model: 'gemini-pro' });
    const prompt = `Create an outpatient clinic SOAP note using the following details:\n` +
      `Age: ${params.patientAge}\nSex: ${params.patientSex}\n` +
      `Chief complaint: ${params.chiefComplaint}\nHistory: ${params.history}\n` +
      `Exam: ${params.exam}\nAssessment: ${params.assessment}\nPlan: ${params.plan}`;
    try {
      const res = await model.generateContent(prompt);
      setResult(res.response.text());
    } catch (err) {
      setResult('Failed to generate note.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!userEmail) {
    return <div><div id="g_id_signin"></div></div>;
  }

  if (!approved) {
    return <p>Your account ({userEmail}) is awaiting admin approval.</p>;
  }

  return (
    <div>
      <h2>Generate Clinic SOAP Note</h2>
      <form onSubmit={handleSubmit}>
        <label>Age:<br/>
          <input name="patientAge" value={params.patientAge} onChange={handleChange} required />
        </label><br/>
        <label>Sex:<br/>
          <input name="patientSex" value={params.patientSex} onChange={handleChange} required />
        </label><br/>
        <label>Chief Complaint:<br/>
          <input name="chiefComplaint" value={params.chiefComplaint} onChange={handleChange} required />
        </label><br/>
        <label>History:<br/>
          <textarea name="history" value={params.history} onChange={handleChange} />
        </label><br/>
        <label>Exam:<br/>
          <textarea name="exam" value={params.exam} onChange={handleChange} />
        </label><br/>
        <label>Assessment:<br/>
          <textarea name="assessment" value={params.assessment} onChange={handleChange} />
        </label><br/>
        <label>Plan:<br/>
          <textarea name="plan" value={params.plan} onChange={handleChange} />
        </label><br/>
        <button type="submit" disabled={loading}>{loading ? 'Generating...' : 'Generate Note'}</button>
      </form>
      {result && (
        <div>
          <h3>Generated SOAP Note</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{result}</pre>
        </div>
      )}
    </div>
  );
}

