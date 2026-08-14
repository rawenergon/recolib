
import React, { useState, useEffect } from 'react';
import { getBookByCode, getStudentById, createStudent, issueBook, returnBook } from '../services/dbService';
import { supabase } from '../services/supabaseClient';
import { Book } from '../types';
import Scanner from '../components/Scanner';
import { Icons } from '../components/Icons';

interface StudentKioskProps {
  onAdminClick: () => void;
  onDocsClick: () => void;
}

type KioskMode = 'home' | 'issue_flow' | 'return_flow' | 'auth' | 'processing' | 'result';

const StudentKiosk: React.FC<StudentKioskProps> = ({ onAdminClick, onDocsClick }) => {
  // State
  const [mode, setMode] = useState<KioskMode>('home');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedBook, setScannedBook] = useState<Book | null>(null);
  const [studentDetails, setStudentDetails] = useState({ id: '', name: '', email: '', phone: '' });
  const [isExistingStudent, setIsExistingStudent] = useState(false);
  const [message, setMessage] = useState({ title: '', text: '', type: 'success' });
  const [loading, setLoading] = useState(false);
  
  // Input for manual code
  const [manualCode, setManualCode] = useState('');
  // Live validation: 'idle' | 'valid' | 'invalid'
  const [codeStatus, setCodeStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  // Librarian (admin) presence gate for issuing
  const [isLibrarian, setIsLibrarian] = useState(false);

  // Watch admin auth session — issuing is only allowed while a librarian is signed in on this device
  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active) setIsLibrarian(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLibrarian(!!session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Debounced live code validation for the manual-entry button
  useEffect(() => {
    const code = manualCode.trim();

    if (code.length < 3 || code.length > 17 || mode === 'auth' || mode === 'result' || mode === 'processing') {
      setCodeStatus('idle');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const book = await getBookByCode(code);
        if (!book) {
          setCodeStatus('invalid');
          return;
        }
        const usable =
          mode === 'issue_flow' ? book.status === 'AVAILABLE'
          : mode === 'return_flow' ? book.status === 'ISSUED'
          : false;
        setCodeStatus(usable ? 'valid' : 'invalid');
      } catch {
        setCodeStatus('invalid');
      }
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualCode, mode]);

  // --- Logic ---

  // Ask for camera permission inside the button tap (user gesture) so the
  // browser shows the prompt once and remembers the grant for this origin.
  // The track is released immediately; the scanner reuses the granted permission.
  const warmUpCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach((t) => t.stop());
    } catch {
      // Scanner shows its own permission/error handling
    }
  };

  const handleFlowSelection = (flow: 'issue' | 'return') => {
    setMode(flow === 'issue' ? 'issue_flow' : 'return_flow');
    setManualCode('');
    setCodeStatus('idle');
    setScannedBook(null);
  };

  const handleBackToHome = () => {
    setMode('home');
    reset();
  };

  const processBookCode = async (code: string) => {
    if (!code || !code.trim()) return;
    
    setShowScanner(false);
    setLoading(true);
    setMode('processing');

    try {
      const book = await getBookByCode(code);
      
      if (!book) {
        setMode('result');
        setMessage({ title: 'ASSET NOT FOUND', text: `ID ${code} does not exist in the ecosystem.`, type: 'error' });
        return;
      }

      setScannedBook(book);
      
      if (mode === 'issue_flow') {
          if (!isLibrarian) {
             setMode('result');
             setMessage({ title: 'LIBRARIAN REQUIRED', text: 'Issuing is only permitted in front of the librarian. Please ask library staff to sign in on this device first.', type: 'error' });
          } else if (book.status === 'ISSUED') {
             setMode('result');
             setMessage({ title: 'UNAVAILABLE', text: `"${book.title}" is currently issued to another student.`, type: 'error' });
          } else {
             // Proceed to Issue
             setMode('auth');
          }
      } else if (mode === 'return_flow') {
          if (book.status === 'AVAILABLE') {
             setMode('result');
             setMessage({ title: 'NOT ISSUED', text: `"${book.title}" is already marked as available in the library.`, type: 'error' });
          } else {
             // Proceed to Return
             await executeReturn(book);
          }
      }

    } catch (e) {
      console.error(e);
      setMode('result');
      setMessage({ title: 'SYSTEM ERROR', text: 'Failed to sync with database.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const executeReturn = async (book: Book) => {
    try {
      const result = await returnBook(book.id);
      setMode('result');
      setMessage({ 
        title: 'RETURN LOGGED', 
        text: `Thank you, ${result.studentName || 'Student'}. "${book.title}" is now pending admin verification.`, 
        type: 'success' 
      });
    } catch (e: any) {
      setMode('result');
      setMessage({ title: 'RETURN FAILED', text: e.message, type: 'error' });
    }
  };

  const executeIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scannedBook) return;

    if (!isLibrarian) {
      setMode('result');
      setMessage({ title: 'LIBRARIAN REQUIRED', text: 'Issuing is only permitted in front of the librarian. Please ask library staff to sign in on this device first.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      let student = await getStudentById(studentDetails.id);

      if (!student) {
        if (!studentDetails.name || !studentDetails.email || !studentDetails.phone) {
          throw new Error("Full registration required for new IDs.");
        }
        student = await createStudent(studentDetails.id, studentDetails.name, studentDetails.email, studentDetails.phone);
      }

      await issueBook(scannedBook.id, student.id);
      
      setMode('result');
      setMessage({ 
        title: 'ACCESS GRANTED', 
        text: `"${scannedBook.title}" has been linked to ID: ${student.student_id}. Return due in 10 days.`, 
        type: 'success' 
      });

    } catch (err: any) {
        setMode('result');
        setMessage({ title: 'ISSUE FAILED', text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleIdBlur = async () => {
    if (studentDetails.id.length > 0) {
      try {
          const student = await getStudentById(studentDetails.id);
          if (student) {
            setStudentDetails(prev => ({ 
                ...prev, 
                name: student.name || '',
                email: student.email, 
                phone: student.phone 
            }));
            setIsExistingStudent(true);
          } else {
            setIsExistingStudent(false);
          }
      } catch (e) {
          setIsExistingStudent(false);
      }
    }
  };

  const reset = () => {
    setMode('home');
    setScannedBook(null);
    setStudentDetails({ id: '', name: '', email: '', phone: '' });
    setIsExistingStudent(false);
    setManualCode('');
    setCodeStatus('idle');
  };

  // --- Render Components ---

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 font-sans flex flex-col relative overflow-hidden selection:bg-indigo-500/20 transition-colors duration-300">
      
      {/* Top Navigation */}
      <nav className="w-full px-8 py-8 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
            <Icons.Logo className="w-8 h-8" />
            <span className="text-xs font-bold tracking-[0.25em] font-mono text-zinc-900 dark:text-white">RECOLABS</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onDocsClick}
            className="text-[10px] font-bold tracking-widest text-zinc-500 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-white transition-colors uppercase"
          >
            Docs
          </button>
          <button 
            onClick={onAdminClick}
            className="text-[10px] font-bold tracking-widest text-zinc-500 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-white transition-colors uppercase border border-transparent hover:border-zinc-200 dark:hover:border-white/10 px-4 py-2 rounded-full"
          >
            Admin Panel
          </button>
        </div>
      </nav>

      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] transition-all duration-1000 ${mode === 'issue_flow' ? 'bg-indigo-200/50 dark:bg-indigo-900/20' : mode === 'return_flow' ? 'bg-emerald-200/50 dark:bg-emerald-900/10' : 'bg-zinc-200/50 dark:bg-zinc-900/10'}`}></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 z-40 relative w-full max-w-5xl mx-auto">
        
        {/* HOME MODE: Choose Path */}
        {mode === 'home' && (
             <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
                 {/* ISSUE CARD */}
                 <button 
                    onClick={() => handleFlowSelection('issue')}
                    className="group relative h-96 rounded-3xl border border-zinc-200 dark:border-white/5 bg-white/50 dark:bg-zinc-900/30 backdrop-blur-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-500/30 transition-all overflow-hidden flex flex-col items-center justify-center text-center p-8 shadow-xl dark:shadow-none"
                 >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-20 h-20 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:border-indigo-500/50 transition-all shadow-xl dark:shadow-2xl">
                        <Icons.BookOpen className="w-8 h-8 text-zinc-400 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">ISSUE RESOURCE</h2>
                    <p className="text-zinc-500 text-sm font-mono max-w-xs">Check out books, comics, or materials from the library.</p>
                    <span className={`mt-8 text-[10px] font-bold uppercase tracking-[0.2em] transition-all translate-y-2 group-hover:translate-y-0 flex items-center gap-2 ${isLibrarian ? 'opacity-0 group-hover:opacity-100 text-indigo-600 dark:text-indigo-500' : 'opacity-100 group-hover:opacity-100 text-amber-600 dark:text-amber-500'}`}>
                        {isLibrarian ? <><Icons.CheckCircle className="w-4 h-4" /> Librarian Present — Initiate &rarr;</> : <><Icons.AlertCircle className="w-4 h-4" /> Librarian Sign-in Required &rarr;</>}
                    </span>
                 </button>

                 {/* RETURN CARD */}
                 <button 
                    onClick={() => handleFlowSelection('return')}
                    className="group relative h-96 rounded-3xl border border-zinc-200 dark:border-white/5 bg-white/50 dark:bg-zinc-900/30 backdrop-blur-sm hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-500/30 transition-all overflow-hidden flex flex-col items-center justify-center text-center p-8 shadow-xl dark:shadow-none"
                 >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-20 h-20 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:border-emerald-500/50 transition-all shadow-xl dark:shadow-2xl">
                        <Icons.CheckCircle className="w-8 h-8 text-zinc-400 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">RETURN RESOURCE</h2>
                    <p className="text-zinc-500 text-sm font-mono max-w-xs">Return borrowed items to the ecosystem.</p>
                    <span className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">Initiate Sequence &rarr;</span>
                 </button>
             </div>
        )}

        {/* FLOW MODE: Scan or Type */}
        {(mode === 'issue_flow' || mode === 'return_flow') && (
             <div className="flex flex-col items-center w-full max-w-md animate-in slide-in-from-bottom-8 fade-in duration-500">
                 <button onClick={handleBackToHome} className="self-start mb-8 text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center gap-2 uppercase tracking-wider transition-colors">
                     <Icons.ArrowRight className="w-4 h-4 rotate-180" /> Back
                 </button>
                 
                 <div className="text-center mb-10">
                     <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">
                         {mode === 'issue_flow' ? 'ISSUE ITEM' : 'RETURN ITEM'}
                     </h2>
                     <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
                         {mode === 'issue_flow' ? 'Scan to check availability' : 'Scan to verify return'}
                     </p>
                     {mode === 'issue_flow' && (
                         <p className={`mt-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                             isLibrarian
                             ? 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10'
                             : 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10'
                         }`}>
                             {isLibrarian ? <><Icons.CheckCircle className="w-3.5 h-3.5" /> Librarian Authorized</> : <><Icons.AlertCircle className="w-3.5 h-3.5" /> Librarian must be signed in to issue</>}
                         </p>
                     )}
                 </div>

                 {/* Scan Button */}
                 <button 
                    onClick={() => {
                        setShowScanner(true);
                        warmUpCamera();
                    }}
                    className={`w-full py-6 rounded-2xl border flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98] mb-8 shadow-xl hover:shadow-2xl ${
                        mode === 'issue_flow' 
                        ? 'bg-indigo-600 border-indigo-500 hover:bg-indigo-500 text-white' 
                        : 'bg-emerald-600 border-emerald-500 hover:bg-emerald-500 text-white'
                    }`}
                 >
                     <Icons.QrCode className="w-6 h-6" />
                     <span className="text-sm font-bold tracking-[0.2em]">ACTIVATE SCANNER</span>
                 </button>

                 <div className="flex items-center w-full gap-4 mb-8">
                     <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
                     <span className="text-[10px] text-zinc-500 dark:text-zinc-600 font-mono uppercase">Or Enter Manually</span>
                     <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1"></div>
                 </div>

                 {/* Manual Input */}
                 <div className="relative w-full">
                    <input 
                        type="text" 
                        value={manualCode}
                        maxLength={17}
                        onChange={(e) => setManualCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && processBookCode(manualCode)}
                        placeholder="0000 or ISBN"
                        className={`w-full bg-white dark:bg-zinc-900/50 border-2 rounded-2xl py-5 text-center text-2xl font-mono tracking-[0.5em] text-zinc-900 dark:text-white outline-none transition-all placeholder:text-zinc-300 dark:placeholder:text-zinc-800 shadow-sm dark:shadow-none ${
                          codeStatus === 'valid'
                            ? 'border-emerald-500 dark:border-emerald-500/60 focus:border-emerald-500'
                            : codeStatus === 'invalid'
                            ? 'border-red-500 dark:border-red-500/60 focus:border-red-500'
                            : 'border-zinc-300 dark:border-zinc-800 focus:border-indigo-500 dark:focus:border-white/30'
                        }`}
                    />
                    <button 
                        onClick={() => processBookCode(manualCode)}
                        className={`absolute right-2 top-2 bottom-2 px-4 rounded-xl transition-colors ${
                          codeStatus === 'valid'
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                            : codeStatus === 'invalid'
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                        }`}
                    >
                        <Icons.ArrowRight className="w-5 h-5" />
                    </button>
                 </div>
             </div>
        )}

        {/* AUTH (ISSUE ONLY) */}
        {mode === 'auth' && scannedBook && (
             <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-8 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{scannedBook.title}</h3>
                        <p className="text-xs text-zinc-500 font-mono mt-1 uppercase">{scannedBook.category} // {scannedBook.unique_code || scannedBook.isbn || 'ISBN BOOK'}</p>
                    </div>
                    <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded border border-emerald-200 dark:border-emerald-500/20">
                        AVAILABLE
                    </div>
                </div>

                <form onSubmit={executeIssue} className="space-y-4">
                    <div>
                        <label className="text-[10px] uppercase tracking-widest text-zinc-500 ml-1 mb-2 block font-mono">Student ID</label>
                        <input 
                            type="text" 
                            value={studentDetails.id}
                            onChange={(e) => setStudentDetails({...studentDetails, id: e.target.value})}
                            onBlur={handleIdBlur}
                            className="w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 focus:border-indigo-500 rounded-xl p-4 text-zinc-900 dark:text-white outline-none font-mono transition-colors"
                            placeholder="ENTER ID"
                            autoFocus
                        />
                    </div>

                    {/* Fields appear when ID has value */}
                    <div className={`space-y-4 overflow-hidden transition-all duration-500 ${studentDetails.id ? 'max-h-96 opacity-100 pt-2' : 'max-h-0 opacity-0'}`}>
                        <input 
                            type="text" 
                            value={studentDetails.name}
                            onChange={(e) => setStudentDetails({...studentDetails, name: e.target.value})}
                            readOnly={isExistingStudent}
                            placeholder="FULL NAME"
                            className={`w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 focus:border-indigo-500 rounded-xl p-4 text-sm text-zinc-900 dark:text-white outline-none font-mono transition-colors ${isExistingStudent && 'text-zinc-500 cursor-not-allowed'}`}
                            required
                        />
                        <input 
                            type="email" 
                            value={studentDetails.email}
                            onChange={(e) => setStudentDetails({...studentDetails, email: e.target.value})}
                            readOnly={isExistingStudent}
                            placeholder="EMAIL ADDRESS"
                            className={`w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 focus:border-indigo-500 rounded-xl p-4 text-sm text-zinc-900 dark:text-white outline-none font-mono transition-colors ${isExistingStudent && 'text-zinc-500 cursor-not-allowed'}`}
                            required
                        />
                         <input 
                            type="tel" 
                            value={studentDetails.phone}
                            onChange={(e) => setStudentDetails({...studentDetails, phone: e.target.value})}
                            readOnly={isExistingStudent}
                            placeholder="PHONE NUMBER"
                            className={`w-full bg-zinc-50 dark:bg-black border border-zinc-300 dark:border-zinc-800 focus:border-indigo-500 rounded-xl p-4 text-sm text-zinc-900 dark:text-white outline-none font-mono transition-colors ${isExistingStudent && 'text-zinc-500 cursor-not-allowed'}`}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <button type="button" onClick={reset} className="py-4 rounded-xl border border-zinc-300 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white text-xs font-bold tracking-widest transition-colors">
                            CANCEL
                        </button>
                        <button type="submit" disabled={loading} className="py-4 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 text-xs font-bold tracking-widest transition-colors shadow-lg dark:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                            {loading ? 'SYNCING...' : 'CONFIRM ISSUE'}
                        </button>
                    </div>
                </form>
             </div>
        )}

        {/* RESULT SCREEN */}
        {mode === 'result' && (
             <div className="w-full max-w-2xl bg-white/60 dark:bg-black/40 backdrop-blur-2xl border border-zinc-200/50 dark:border-white/10 p-12 rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden flex flex-col items-center text-center">
                
                {/* Background Glow */}
                <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${message.type === 'success' ? 'from-emerald-400 via-teal-500 to-emerald-600' : 'from-red-500 via-rose-500 to-red-600'}`}></div>
                <div className={`absolute -top-20 -left-20 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                <div className={`absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-[100px] opacity-20 pointer-events-none ${message.type === 'success' ? 'bg-indigo-500' : 'bg-orange-500'}`}></div>

                {/* Icon */}
                <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-8 shadow-xl ${message.type === 'success' ? 'bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-emerald-500/30' : 'bg-gradient-to-br from-red-400 to-rose-600 text-white shadow-red-500/30'}`}>
                    {message.type === 'success' ? <Icons.CheckCircle className="w-14 h-14" /> : <Icons.AlertCircle className="w-14 h-14" />}
                </div>

                {/* Text */}
                <h3 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-6 tracking-tighter">
                    {message.title}
                </h3>
                
                <div className="bg-white/50 dark:bg-white/5 border border-zinc-200/50 dark:border-white/5 rounded-2xl p-6 mb-10 w-full max-w-lg mx-auto backdrop-blur-sm">
                    <p className="text-zinc-700 dark:text-zinc-300 text-lg md:text-xl font-medium leading-relaxed">
                        {message.text}
                    </p>
                </div>

                {/* Button */}
                <button 
                    onClick={reset} 
                    className="group relative px-12 py-5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black text-sm font-bold tracking-[0.2em] uppercase transition-all hover:scale-105 shadow-xl hover:shadow-2xl overflow-hidden"
                >
                    <span className="relative z-10">Return to System</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
             </div>
        )}

        {/* LOADING */}
        {mode === 'processing' && (
            <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-zinc-300 dark:border-zinc-800 border-t-zinc-900 dark:border-t-white rounded-full animate-spin mb-6"></div>
                <p className="text-xs font-mono tracking-[0.3em] text-zinc-500 animate-pulse">ACCESSING DATABASE...</p>
            </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full py-6 text-center z-40">
        <div className="flex items-center justify-center gap-2 opacity-30">
             <div className="w-1.5 h-1.5 bg-zinc-900 dark:bg-white rounded-full"></div>
             <p className="text-[10px] font-bold font-mono tracking-[0.3em] text-zinc-900 dark:text-white">RECO ECOSYSTEM v2.0</p>
        </div>
      </footer>

      {/* Scanner Overlay */}
      {showScanner && (
        <Scanner onScan={processBookCode} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
};

export default StudentKiosk;
