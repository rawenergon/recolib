import React, { useState } from 'react';
import { getUserHistoryByStudentId } from '../services/dbService';
import BookCover from '../components/BookCover';
import { Icons } from '../components/Icons';
import { Student, Transaction } from '../types';

interface UserPortalProps {
  onBack: () => void;
}

const UserPortal: React.FC<UserPortalProps> = ({ onBack }) => {
  const [studentId, setStudentId] = useState('');
  const [student, setStudent] = useState<Student | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE_SIZE = 5;

  const search = async (id: string) => {
    const trimmedId = id.trim();
    if (!trimmedId) return;
    setLoading(true);
    setError('');
    try {
      const { student: foundStudent, data, hasMore: more } = await getUserHistoryByStudentId(trimmedId, PAGE_SIZE, 0);
      if (!foundStudent) {
        setStudent(null);
        setTransactions([]);
        setError(`No student registered with ID "${trimmedId}". Use the kiosk to register first.`);
      } else {
        setStudent(foundStudent);
        setTransactions(data);
        setHasMore(more);
        setOffset(PAGE_SIZE);
      }
    } catch {
      setError('Failed to load history. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!student || loadingMore) return;
    setLoadingMore(true);
    try {
      const { data, hasMore: more } = await getUserHistoryByStudentId(student.student_id, PAGE_SIZE, offset);
      setTransactions((prev) => [...prev, ...data]);
      setOffset((prev) => prev + data.length);
      setHasMore(more);
    } catch {
      setError('Failed to load more history.');
    } finally {
      setLoadingMore(false);
    }
  };

  const active = transactions.filter((t) => t.status === 'ACTIVE' && t.return_date === null).length;
  const pending = transactions.filter((t) => t.status === 'ACTIVE' && t.return_date !== null).length;
  const returned = transactions.filter((t) => t.status === 'RETURNED').length;

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white font-sans transition-colors duration-300 flex flex-col relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen"></div>
      </div>

      {/* Top Navigation */}
      <nav className="w-full px-8 py-8 flex items-center justify-between relative z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-white transition-colors text-[10px] font-bold tracking-widest uppercase">
          <Icons.ArrowRight className="w-4 h-4 rotate-180" /> Back to Kiosk
        </button>
        <div className="flex items-center gap-3">
          <Icons.Logo className="w-8 h-8" />
          <span className="text-xs font-bold tracking-[0.25em] font-mono text-zinc-900 dark:text-white">RECO LIB</span>
        </div>
      </nav>

      <main className="flex-1 w-full max-w-3xl mx-auto px-6 pb-24 relative z-10 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-4 mt-4">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
            <Icons.User className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">Student Portal</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-3 text-center bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent">
          Your Book History.
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-light leading-relaxed text-center max-w-md mb-8">
          Enter the student ID you use at the kiosk to see every book you have ever issued and returned.
        </p>

        {/* Search */}
        <div className="w-full max-w-md flex gap-3 mb-10">
          <input
            type="text"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search(studentId)}
            placeholder="Student ID"
            className="flex-1 bg-white dark:bg-zinc-900/50 border-2 border-zinc-300 dark:border-zinc-800 rounded-2xl px-5 py-4 text-center text-lg font-mono tracking-[0.2em] text-zinc-900 dark:text-white outline-none transition-all focus:border-indigo-500 dark:focus:border-white/30 placeholder:text-zinc-300 dark:placeholder:text-zinc-800 shadow-sm"
          />
          <button
            onClick={() => search(studentId)}
            disabled={loading}
            className="px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase text-xs tracking-widest transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2"
          >
            <Icons.ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400 font-mono text-xs uppercase tracking-widest animate-in fade-in">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            Fetching history&hellip;
          </div>
        )}

        {error && !loading && (
          <div className="w-full max-w-md p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold text-center animate-in fade-in">
            {error}
          </div>
        )}

        {student && !loading && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Identity Card */}
            <div className="mb-6 p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center gap-4 shadow-sm">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xl">
                {student.name.trim().charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold leading-tight">{student.name}</h2>
                <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 mt-0.5">ID: {student.student_id}</p>
              </div>
              <div className="flex gap-2">
                {[
                  { label: 'ACTIVE', val: active, cls: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-500/20' },
                  { label: 'PENDING', val: pending, cls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20' },
                  { label: 'RETURNED', val: returned, cls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' },
                ].map((s) => (
                  <div key={s.label} className={`px-3 py-2 rounded-xl border text-center`}>
                    <p className={`text-lg font-bold ${s.cls.split(' ')[2]}`}>{s.val}</p>
                    <p className={`text-[8px] font-bold uppercase tracking-widest ${s.cls.split(' ')[3]}`}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* History */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3 font-mono">Transaction History ({transactions.length})</p>
            {transactions.length === 0 ? (
              <div className="p-10 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 text-center">
                <Icons.BookOpen className="w-8 h-8 mx-auto mb-3 text-zinc-300 dark:text-zinc-700" />
                <p className="text-sm text-zinc-500 dark:text-zinc-400">No transactions yet. Issue a book at the kiosk to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => {
                  const status = tx.return_date && tx.status === 'ACTIVE'
                    ? { label: 'PENDING REVIEW', cls: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300' }
                    : tx.status === 'ACTIVE'
                      ? { label: 'ISSUED', cls: 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' }
                      : { label: 'RETURNED', cls: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300' };
                  return (
                    <div key={tx.id} className="p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex gap-5 shadow-sm">
                      <div className="w-14 h-20 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-white/5 shrink-0">
                        <BookCover isbn={tx.books?.isbn} size="S" boxClassName="w-full h-full" imgClassName="w-full h-full object-cover" iconSize="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm leading-tight truncate">{tx.books?.title || 'Unknown Book'}</h3>
                            <p className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-1 uppercase">{tx.books?.category || '—'} // {tx.books?.unique_code || tx.books?.isbn || 'ISBN BOOK'}</p>
                          </div>
                          <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest ${status.cls}`}>{status.label}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-3 text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                          <span className="flex items-center gap-1.5"><Icons.Clock className="w-3 h-3" /> Issued: {formatDate(tx.issue_date)} · {formatTime(tx.issue_date)}</span>
                          <span className="flex items-center gap-1.5"><Icons.CheckCircle className="w-3 h-3" /> Return: {tx.return_date ? `${formatDate(tx.return_date)} · ${formatTime(tx.return_date)}` : (tx.status === 'ACTIVE' ? 'Not yet returned' : '—')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {hasMore && (
              <div className="text-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors disabled:opacity-50"
                >
                  {loadingMore ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserPortal;