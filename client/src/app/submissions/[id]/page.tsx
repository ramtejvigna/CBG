"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Cpu, Lock } from 'lucide-react';
import Loader from '@/components/Loader';
import CodeEditor from '@/components/CodeEditor';
import { useThemeStore } from '@/lib/store/themeStore';
import { createAuthHeaders } from '@/lib/auth';
import { generateChallengeUrl } from '@/lib/challengeUtils';

interface TestResult {
  testCaseId?: string;
  input?: string;
  expectedOutput?: string;
  actualOutput?: string;
  passed: boolean;
  status?: string;
  runtime?: number;
  memory?: number;
  error?: string;
  hidden?: boolean;
}

interface SubmissionDetail {
  id: string;
  code: string;
  status: string;
  runtime?: number | null;
  memory?: number | null;
  createdAt: string;
  testResults: TestResult[];
  challenge: { id: string; title: string; difficulty: string; points: number };
  language: { id: string; name: string };
  user: { username: string; name?: string | null };
}

const monacoLanguage = (name: string) => {
  const n = name.toLowerCase();
  if (n === 'c++') return 'cpp';
  if (n === 'c#') return 'csharp';
  return n;
};

const formatStatus = (status: string) =>
  status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

export default function SubmissionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/submissions/${id}`, {
          headers: createAuthHeaders(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || 'Could not load this submission');
        if (!cancelled) setSubmission(data.submission);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load this submission');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id]);

  const bg = isDark ? 'bg-gray-900 text-gray-200' : 'bg-white text-gray-800';
  const card = isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200';
  const divider = isDark ? 'border-gray-700' : 'border-gray-200';
  const muted = isDark ? 'text-gray-400' : 'text-gray-500';

  if (loading) {
    return <div className={`min-h-screen flex items-center justify-center ${bg}`}><Loader /></div>;
  }

  if (error || !submission) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center gap-4 px-4 text-center ${bg}`}>
        <p className="text-xl font-semibold">{error || 'Submission not found'}</p>
        <button onClick={() => router.back()} className="px-4 py-2 rounded-lg bg-orange-500 text-white">Go back</button>
      </div>
    );
  }

  const accepted = submission.status === 'ACCEPTED';
  const passed = submission.testResults.filter((t) => t.passed).length;

  return (
    <div className={`min-h-screen ${bg}`}>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <button onClick={() => router.back()} className={`flex items-center gap-2 text-sm ${muted} hover:text-orange-500`}>
          <ArrowLeft size={16} /> Back
        </button>

        <div className={`rounded-xl border p-6 ${card}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <a href={generateChallengeUrl(submission.challenge.title)} className="text-2xl font-bold hover:text-orange-500">
                {submission.challenge.title}
              </a>
              <p className={`text-sm mt-1 ${muted}`}>
                {submission.challenge.difficulty} · submitted by @{submission.user.username} on{' '}
                {new Date(submission.createdAt).toLocaleString()}
              </p>
            </div>
            <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${accepted ? 'bg-green-500/15 text-green-500' : 'bg-red-500/15 text-red-500'}`}>
              {accepted ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              {formatStatus(submission.status)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 text-sm">
            <div><div className={muted}>Language</div><div className="font-semibold">{submission.language.name}</div></div>
            <div><div className={`${muted} flex items-center gap-1`}><Clock size={13} /> Runtime</div><div className="font-semibold">{submission.runtime ?? 0} ms</div></div>
            <div><div className={`${muted} flex items-center gap-1`}><Cpu size={13} /> Memory</div><div className="font-semibold">{submission.memory ?? 0} KB</div></div>
            <div><div className={muted}>Tests passed</div><div className="font-semibold">{passed} / {submission.testResults.length}</div></div>
          </div>
        </div>

        <div className={`rounded-xl border overflow-hidden ${card}`}>
          <div className={`px-4 py-3 font-semibold border-b ${divider}`}>Code</div>
          {/* CodeEditor fills its parent, so the parent needs a real height */}
          <div style={{ height: 'min(70vh, 480px)' }}>
            <CodeEditor
              value={submission.code}
              onChange={() => {}}
              language={monacoLanguage(submission.language.name)}
              readOnly
            />
          </div>
        </div>

        <div className={`rounded-xl border ${card}`}>
          <div className={`px-4 py-3 font-semibold border-b ${divider}`}>Test results</div>
          <ul className={`divide-y ${divider}`}>
            {submission.testResults.map((t, i) => (
              <li key={t.testCaseId ?? i} className="p-4 text-sm space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  {t.passed ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}
                  Test {i + 1}
                  {t.hidden && <span className={`flex items-center gap-1 text-xs ${muted}`}><Lock size={12} /> hidden</span>}
                  {t.runtime !== undefined && <span className={`ml-auto text-xs ${muted}`}>{t.runtime} ms</span>}
                </div>
                {!t.hidden && (
                  <div className="grid sm:grid-cols-3 gap-3 font-mono text-xs">
                    <div><div className={`${muted} mb-1`}>Input</div><pre className="whitespace-pre-wrap break-all">{t.input}</pre></div>
                    <div><div className={`${muted} mb-1`}>Expected</div><pre className="whitespace-pre-wrap break-all">{t.expectedOutput}</pre></div>
                    <div><div className={`${muted} mb-1`}>Your output</div><pre className="whitespace-pre-wrap break-all">{t.actualOutput}</pre></div>
                  </div>
                )}
                {!t.hidden && t.error && <pre className="whitespace-pre-wrap text-xs text-red-400">{t.error}</pre>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
