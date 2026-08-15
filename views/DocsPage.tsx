import React, { useState } from 'react';
import { Icons } from '../components/Icons';

interface DocsPageProps {
  onBack: () => void;
}

const DocsPage: React.FC<DocsPageProps> = ({ onBack }) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('intro');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsNavOpen(false);
  };

  const sections = [
    { id: 'intro', label: 'Introduction' },
    { id: 'overview', label: 'System Overview' },
    { id: 'how-it-works', label: 'How It Works' },
    { id: 'tech-stack', label: 'Tech Stack' },
    { id: 'admin-guide', label: 'Admin Guide' },
    { id: 'student-guide', label: 'Student Guide' },
    { id: 'security', label: 'Security Model' },
    { id: 'developer', label: 'Developer' },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-indigo-500/30 flex transition-colors duration-300">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen"></div>
      </div>

      {/* Mobile Back Button (Top Left) */}
      <button 
        onClick={onBack}
        className="fixed top-6 left-6 z-50 p-3 rounded-full bg-white dark:bg-zinc-900 shadow-lg border border-zinc-200 dark:border-white/10 lg:hidden text-zinc-900 dark:text-white hover:scale-105 transition-transform"
        title="Back to Kiosk"
      >
        <Icons.ArrowRight className="w-5 h-5 rotate-180" />
      </button>

      {/* Mobile Nav Toggle (Top Right) */}
      <button 
        onClick={() => setIsNavOpen(!isNavOpen)}
        className="fixed top-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-zinc-900 shadow-lg border border-zinc-200 dark:border-white/10 lg:hidden text-zinc-900 dark:text-white hover:scale-105 transition-transform"
        title="Toggle Navigation"
      >
        {isNavOpen ? <Icons.X className="w-5 h-5" /> : <Icons.Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar Navigation */}
      {/* Mobile: Fixed Right. Desktop: Fixed Left. */}
      <aside className={`fixed inset-y-0 z-40 w-64 bg-white dark:bg-[#0A0A0A] border-zinc-200 dark:border-white/5 transform transition-transform duration-300 
        lg:left-0 lg:translate-x-0 lg:border-r lg:shadow-none
        right-0 border-l shadow-2xl
        ${isNavOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={onBack}>
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold tracking-[0.25em] font-mono">RECO LIB DOCS</span>
          </div>

          <nav className="flex-1 space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-between group ${
                  activeSection === section.id 
                    ? 'bg-zinc-100 dark:bg-white/5 text-indigo-600 dark:text-indigo-400' 
                    : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {section.label}
                <Icons.ChevronRight className={`w-3 h-3 transition-transform ${activeSection === section.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-50'}`} />
              </button>
            ))}
          </nav>

          <div className="pt-8 border-t border-zinc-100 dark:border-white/5 space-y-3">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors uppercase tracking-widest"
            >
              <Icons.ArrowRight className="w-3 h-3 rotate-180" />
              Exit Docs
            </button>
            <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Docs v2.1 · RECO LIB</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-8 lg:p-16 max-w-5xl mx-auto space-y-24 pt-24 lg:pt-16 relative z-10">
        
        {/* Introduction */}
        <section id="intro" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">
              <Icons.BookOpen className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-mono">Documentation</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-6 bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent">
            Documentation.
          </h1>
          <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed font-light max-w-2xl">
            Welcome to the comprehensive guide for the <span className="text-zinc-900 dark:text-white font-medium">RECO LIB</span>. A minimal, next-generation library management solution designed for seamless asset tracking via ISBN integration.
          </p>
          <div className="flex flex-wrap gap-2 mt-8">
            {['Version 2.1', 'Stable Release', 'ISBN Powered', 'Supabase Backed', 'Open Source'].map((badge) => (
              <span key={badge} className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                {badge}
              </span>
            ))}
          </div>
        </section>

        {/* System Overview */}
        <section id="overview" className="space-y-6 pt-10 border-t border-zinc-200 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"><Icons.Database className="w-5 h-5" /></span>
            <h2 className="text-2xl font-bold uppercase tracking-wide">System Overview</h2>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            The Reco System operates on a dual-interface architecture connecting a centralized Admin Dashboard with public Student Kiosks.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
              <h3 className="text-lg font-bold mb-2">Student Kiosk</h3>
              <p className="text-sm text-zinc-500 font-mono">Public Facing Interface</p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex items-center gap-2"><Icons.CheckCircle className="w-3 h-3 text-emerald-500"/> Instant ISBN Barcode Scanning</li>
                <li className="flex items-center gap-2"><Icons.CheckCircle className="w-3 h-3 text-emerald-500"/> Real-time Availability Check</li>
                <li className="flex items-center gap-2"><Icons.CheckCircle className="w-3 h-3 text-emerald-500"/> Secure Student Authentication</li>
                <li className="flex items-center gap-2"><Icons.CheckCircle className="w-3 h-3 text-emerald-500"/> Supervised Issue &amp; Return Flows</li>
              </ul>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
              <h3 className="text-lg font-bold mb-2">Admin Panel</h3>
              <p className="text-sm text-zinc-500 font-mono">Secure Control Center</p>
              <ul className="mt-4 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li className="flex items-center gap-2"><Icons.CheckCircle className="w-3 h-3 text-indigo-500"/> Asset &amp; Folder Management</li>
                <li className="flex items-center gap-2"><Icons.CheckCircle className="w-3 h-3 text-indigo-500"/> Return Verification Queue</li>
                <li className="flex items-center gap-2"><Icons.CheckCircle className="w-3 h-3 text-indigo-500"/> Overdue Tracking Logs</li>
                <li className="flex items-center gap-2"><Icons.CheckCircle className="w-3 h-3 text-indigo-500"/> Librarian-Supervised Issuing</li>
              </ul>
            </div>
          </div>

          {/* Flow Diagram */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 mt-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-4 font-mono">System Flow</h3>
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold uppercase tracking-wider font-mono">
              <span className="px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">Student Kiosk</span>
              <Icons.ArrowRight className="w-4 h-4 text-zinc-400" />
              <span className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10">ISBN Scan / Manual Entry</span>
              <Icons.ArrowRight className="w-4 h-4 text-zinc-400" />
              <span className="px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">Supabase Database</span>
              <Icons.ArrowRight className="w-4 h-4 text-zinc-400" />
              <span className="px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">Admin Review</span>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="space-y-6 pt-10 border-t border-zinc-200 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"><Icons.AlertCircle className="w-5 h-5" /></span>
            <h2 className="text-2xl font-bold uppercase tracking-wide">How The System Works</h2>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            A complete walkthrough of the RECO engine &mdash; from the browser to the database, and back.
          </p>

          {/* 1. Architecture */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
            <h3 className="text-lg font-bold mb-3 font-mono">01 // Architecture &amp; Request Path</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-4">
              RECO is a <strong>serverless single-page application</strong>. There is no custom backend &mdash; the database <em>is</em> the backend.
            </p>
            <div className="space-y-3 font-mono text-xs">
              {[
                ['1', 'The React SPA loads once; every screen (Kiosk, Admin, Docs) is a client-side route rendered from /, /admin and /docs.'],
                ['2', 'All data calls go through supabase-js, which talks to Supabase over PostgREST (a REST layer over SQL).'],
                ['3', 'The SQL runs in PostgreSQL 17. Row-Level Security rules decide if each query is allowed.', 'text-emerald-600 dark:text-emerald-400'],
                ['4', 'Live book covers and ISBN metadata come from the free OpenLibrary API &mdash; not from our database.'],
                ['5', 'No polling, no queues: every screen refetches on open, which keeps the kiosk and dashboard instantly consistent.'],
              ].map(([num, text, color]) => (
                <div key={num} className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-500/20 flex items-center justify-center text-[10px] font-bold">{num}</span>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed pt-0.5"><span className={`font-bold ${color || 'text-zinc-800 dark:text-zinc-200'}`}>{text}</span></p>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Data Model */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
            <h3 className="text-lg font-bold mb-3 font-mono">02 // Data Model</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-4">
              Three tables drive the entire ecosystem. Every card on the dashboard is derived from these.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 mb-3 font-mono">Books</p>
                <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                  <li><span className="text-zinc-400">title</span> — display name</li>
                  <li><span className="text-zinc-400">isbn</span> — primary identity</li>
                  <li><span className="text-zinc-400">category</span> — folder/tag</li>
                  <li><span className="text-zinc-400">unique_code</span> — legacy only</li>
                  <li><span className="text-zinc-400">status</span> — AVAILABLE / ISSUED</li>
                  <li><span className="text-zinc-400">author, publisher, pages…</span> — OpenLibrary</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3 font-mono">Students</p>
                <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                  <li><span className="text-zinc-400">student_id</span> — typed at kiosk</li>
                  <li><span className="text-zinc-400">name / email / phone</span></li>
                  <li><span className="text-zinc-400">created_at</span> — first-use time</li>
                  <li className="pt-2 text-zinc-500">Auto-registered on first self-issue.</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-3 font-mono">Transactions</p>
                <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                  <li><span className="text-zinc-400">book_id + student_internal_id</span></li>
                  <li><span className="text-zinc-400">issue_date</span> — auto</li>
                  <li><span className="text-zinc-400">return_date</span> — set on return</li>
                  <li><span className="text-zinc-400">status</span> — ACTIVE / RETURNED</li>
                  <li className="pt-2 text-zinc-500">History is never deleted on return.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 3. ISBN Pipeline */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
            <h3 className="text-lg font-bold mb-3 font-mono">03 // The ISBN Pipeline</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-4">
              The ISBN is the single identity of every asset. Three ways it enters the system:
            </p>
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 font-mono">A) Camera Scan</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  The kiosk and the admin add-book form use a camera scanner (html5-qrcode) restricted to the <strong>EAN-13, EAN-8, CODE-128, UPC-A and UPC-E</strong> barcode families &mdash; the standards ISBNs are printed in. QR codes are deliberately not decoded: RECO is ISBN-only.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 font-mono">B) Manual Entry</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  The kiosk input strips dashes and spaces live, then validates against <span className="font-mono text-xs">{'^\\d{9}[\\dX]$'}</span> (ISBN-10) or <span className="font-mono text-xs">{'^\\d{13}$'}</span> (ISBN-13). The confirm button stays grey until the value is a structurally valid ISBN, green when the book exists, red when it does not.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 font-mono">C) Metadata Auto-Fill (Admin)</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  While adding a book, the admin ISBN field auto-queries <span className="font-mono text-xs">openlibrary.org/isbn/&lt;isbn&gt;.json</span> and pre-fills title, author, publisher, page count and binding. Covers render from the OpenLibrary covers CDN; missing covers fall back to a generated placeholder. Lookup faults are silent &mdash; the form still allows manual entry.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 font-mono">D) Resolution</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Every scan or manual code resolves through <span className="font-mono text-xs">getBookByCode()</span>, which matches <span className="font-mono text-xs">unique_code = input OR isbn = input</span> in a single row query. Legacy books with a 4-digit code still resolve via their old code; any ISBN not in the database returns an "ASSET NOT FOUND" card.
                </p>
              </div>
            </div>
          </div>

          {/* 4. Lifecycle */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
            <h3 className="text-lg font-bold mb-3 font-mono">04 // Transaction Lifecycle: ISSUE &rarr; REVIEW &rarr; RETURN</h3>
            <div className="space-y-4">
              {[
                { tag: 'ISSUE', bg: 'bg-indigo-50 dark:bg-indigo-500/10', color: 'text-indigo-600 dark:text-indigo-400', text: 'The kiosk is in Issue flow and a librarian session is active. A valid ISBN resolves to an AVAILABLE book, identity is confirmed (existing student_id or first-time registration of name/email/phone), then issueBook() inserts a transaction as ACTIVE with issue_date and flips the book to ISSUED. Two writes, one logical action.' },
                { tag: 'RETURN', bg: 'bg-amber-50 dark:bg-amber-500/10', color: 'text-amber-600 dark:text-amber-400', text: 'The kiosk is in Return flow. A valid ISBN resolves to an ISSUED book. returnBook() finds its ACTIVE transaction and writes return_date — but deliberately does NOT touch status. The transaction is now in PENDING REVIEW, shown with an amber "Pending Review" label everywhere.' },
                { tag: 'VERIFY', bg: 'bg-emerald-50 dark:bg-emerald-500/10', color: 'text-emerald-600 dark:text-emerald-400', text: 'An admin opens the Review Queue tab, checks the physical item, and clicks Approve. approveReturn() flips the transaction to RETURNED and the book back to AVAILABLE. Only now can the book be issued again — staff verify every return by design.' },
                { tag: 'OVERDUE', bg: 'bg-rose-50 dark:bg-rose-500/10', color: 'text-rose-600 dark:text-rose-400', text: 'Any ACTIVE transaction with no return_date whose issue_date is older than 10 days appears in the Overdue Logs tab with days elapsed and full student contact details. Overdue calculations are derived live from timestamps — nothing is stored or scheduled.' },
              ].map((step) => (
                <div key={step.tag} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 flex gap-4">
                  <span className={`shrink-0 h-fit px-3 py-1.5 rounded-lg ${step.bg} ${step.color} text-[10px] font-bold tracking-widest font-mono`}>{step.tag}</span>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{step.text}</p>
                </div>
              ))}
            </div>
            <div className="p-4 bg-cyan-50/50 dark:bg-cyan-500/5 rounded-xl border border-cyan-100 dark:border-cyan-500/20 font-mono text-xs text-cyan-600 dark:text-cyan-400 mt-4">
              <span className="font-bold">Note:</span> The stat cards on the dashboard are derived in-memory from the transaction list: Books Issued = ACTIVE without return_date, Pending Returns = ACTIVE with return_date, Overdue = older than 10 days.
            </div>
          </div>

          {/* 5. Kiosk State Machine */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
            <h3 className="text-lg font-bold mb-3 font-mono">05 // Kiosk State Machine</h3>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-wider">
              <span className="px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/5">HOME</span>
              <Icons.ArrowRight className="w-3 h-3 text-zinc-400" />
              <span className="px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20">ISSUE / RETURN FLOW</span>
              <Icons.ArrowRight className="w-3 h-3 text-zinc-400" />
              <span className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">SCAN / TYPE ISBN</span>
              <Icons.ArrowRight className="w-3 h-3 text-zinc-400" />
              <span className="px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">IDENTITY (ISSUE ONLY)</span>
              <Icons.ArrowRight className="w-3 h-3 text-zinc-400" />
              <span className="px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">RESULT</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mt-4">
              The flow is gated at every step: the camera only starts after choosing Issue or Return; Issue additionally requires an <strong>active librarian session on the device</strong> (the kiosk checks the same Supabase session as the admin panel, so staff log in once per shift); an ISBN of an unavailable book is rejected before identity is even asked; Return only proceeds for books currently ISSUED.
            </p>
          </div>

          {/* 6. Admin Surface */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
            <h3 className="text-lg font-bold mb-3 font-mono">06 // Admin Dashboard Surface</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                ['Asset Directory', 'Search across title, category, code and author. Filter by folder chips. Add books via typed or scanned ISBN with OpenLibrary auto-fill. Every card opens a detail modal: cover, metadata, current holder, contact, and paginated issue/return history with "Load More". Folders are renamed inline; deleting a book cascades its transactions first.'],
                ['Review Queue', 'Lists PENDING REVIEW transactions (returned but unverified). Approve marks them RETURNED and releases the book back to AVAILABLE.'],
                ['Overdue Logs', 'Live-derived view of ACTIVE transactions past 10 days, with days overdue and student details for follow-up.'],
                ['Users', 'Every registered student with edit (ID, name, email, phone) and delete. The profile modal shows paginated transaction history; deleting a student cascades their history via foreign keys.'],
              ].map(([title, desc]) => (
                <div key={title} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 font-mono">{title}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Auth */}
          <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
            <h3 className="text-lg font-bold mb-3 font-mono">07 // Session &amp; Security Mechanics</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              The admin signs in with Supabase Auth (email + password). The session token is persisted in a <strong>cookie</strong> (30-day max-age, SameSite=Lax) instead of localStorage, so the session survives page reloads and even works inside embedded mobile browsers that block localStorage. The JWT auto-refreshes inside that window. The kiosk reads the same session to enforce the librarian gate. On the database side, Row-Level Security lets the anonymous kiosk role only read books and create students/transactions, while destructive and administrative operations require an authenticated session.
            </p>
          </div>
        </section>

        {/* Tech Stack */}
        <section id="tech-stack" className="space-y-6 pt-10 border-t border-zinc-200 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"><Icons.FileText className="w-5 h-5" /></span>
            <h2 className="text-2xl font-bold uppercase tracking-wide">Tech Stack</h2>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Built with modern, reliable web technologies to ensure speed, security, and maintainability.
          </p>
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {[
              { name: 'Frontend', items: ['React 19', 'TypeScript', 'Vite 6', 'Tailwind CSS'] },
              { name: 'Backend', items: ['Supabase', 'PostgreSQL 17', 'Row-Level Security', 'Supabase Auth'] },
              { name: 'ISBN & Icons', items: ['html5-qrcode', 'qrcode.react', 'lucide-react'] },
            ].map((cat) => (
              <div key={cat.name} className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4 font-mono">{cat.name}</h3>
                <ul className="space-y-2.5">
                  {cat.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                      <Icons.CheckCircle className="w-3.5 h-3.5 text-cyan-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Admin Guide */}
        <section id="admin-guide" className="space-y-6 pt-10 border-t border-zinc-200 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Icons.User className="w-5 h-5" /></span>
            <h2 className="text-2xl font-bold uppercase tracking-wide">Admin Guide</h2>
          </div>
          
          <div className="space-y-8">
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
              <h3 className="text-lg font-bold mb-3 font-mono">01 // Adding Resources</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed mb-4">
                Admins can add books or assets directly from the Directory. When adding a book, specifying a <strong>Category</strong> (e.g., COMIC, MATH) automatically creates or assigns it to a folder. Each new addition requires a valid <strong>ISBN</strong> (barcoded or typed manually).
              </p>
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-xl border border-indigo-100 dark:border-indigo-500/20 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                <span className="font-bold">Tip:</span> Books carry a printable ISBN on their physical copy &mdash; students scan it directly from the kiosk, no extra labels needed.
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
              <h3 className="text-lg font-bold mb-3 font-mono">02 // Supervised Issuing</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                For security, book issuance is only permitted while a <strong>librarian is signed in</strong> on the kiosk device. Students cannot issue assets remotely using a known code — every issue happens in front of library staff.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
              <h3 className="text-lg font-bold mb-3 font-mono">03 // Processing Returns</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                When a student returns a book at the Kiosk, it enters a <strong>"Pending Review"</strong> state. It does not become available immediately. Admins must go to the "Review Queue" tab and click "Approve" to physically verify the item and release it back to the pool.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
              <h3 className="text-lg font-bold mb-3 font-mono">04 // Overdue Tracking</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                Any asset issued for more than <strong>10 days</strong> without a return is flagged as overdue. The Overdue Logs tab lists these items with days elapsed and student details for direct follow-up.
              </p>
            </div>
          </div>
        </section>

        {/* Student Guide */}
        <section id="student-guide" className="space-y-6 pt-10 border-t border-zinc-200 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"><Icons.BookOpen className="w-5 h-5" /></span>
            <h2 className="text-2xl font-bold uppercase tracking-wide">Student Guide</h2>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Students interact with the system via the touch-enabled Kiosk.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border-l-2 border-indigo-500 border border-zinc-200 dark:border-white/5 border-l-indigo-500">
              <h4 className="font-bold text-zinc-900 dark:text-white mb-2">Issuing</h4>
              <p className="text-sm text-zinc-500 mt-1 leading-relaxed">Select "Issue", scan the book ISBN barcode (or type the ISBN). The button turns <span className="text-emerald-500 font-bold">green</span> when the ISBN is valid. If it's your first time, enter Name/Email/Phone. Issuing requires a librarian to be signed in.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border-l-2 border-emerald-500 border border-zinc-200 dark:border-white/5 border-l-emerald-500">
              <h4 className="font-bold text-zinc-900 dark:text-white mb-2">Returning</h4>
              <p className="text-sm text-zinc-500 mt-1 leading-relaxed">Select "Return", scan the book ISBN barcode (or type the ISBN). The system logs the return timestamp and notifies the admin for verification.</p>
            </div>
          </div>
        </section>

        {/* Security Model */}
        <section id="security" className="space-y-6 pt-10 border-t border-zinc-200 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"><Icons.AlertCircle className="w-5 h-5" /></span>
            <h2 className="text-2xl font-bold uppercase tracking-wide">Security Model</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-8">
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3 font-mono">Row-Level Security</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Every table is protected by RLS policies. The public kiosk (anon role) can only read books, register students, and create transactions. Admin operations require an authenticated session.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-3 font-mono">Librarian Gate</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Issuing is blocked unless an admin session is active on the device. This ensures no student can issue an asset remotely or outside library premises.
              </p>
            </div>
          </div>
        </section>

        {/* Developer */}
        <section id="developer" className="space-y-6 pt-10 border-t border-zinc-200 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <span className="p-2 rounded-lg bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400"><Icons.FileText className="w-5 h-5" /></span>
            <h2 className="text-2xl font-bold uppercase tracking-wide">Developer</h2>
          </div>

          <div className="p-8 rounded-3xl bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border border-violet-100 dark:border-violet-500/20 flex flex-col sm:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-xl shadow-indigo-500/20 shrink-0">
              AR
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-600 dark:text-violet-400 font-mono mb-1">Lead Developer</p>
              <h3 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">Aditya Raj</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                Designer and developer of the RECO Ecosystem. Responsible for system architecture, ISBN integration, database design, security policies, and the full user experience.
              </p>
              <div className="flex flex-wrap gap-3 mt-5 justify-center sm:justify-start">
                <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-violet-200 dark:border-violet-500/20 text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">Product Design</span>
                <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-violet-200 dark:border-violet-500/20 text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">Full-Stack Development</span>
                <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-violet-200 dark:border-violet-500/20 text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">Database Architecture</span>
              </div>
              <a
                href="https://ccidcop.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-5 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-bold uppercase tracking-widest transition-colors shadow-lg shadow-violet-600/20"
              >
                <Icons.ExternalLink className="w-4 h-4" /> ccidcop.in
              </a>
            </div>
          </div>

          {/* Credit Line */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <div className="h-px bg-zinc-200 dark:bg-white/10 flex-1 max-w-[120px]"></div>
            <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 uppercase tracking-widest text-center">
              Developed with <span className="text-rose-500">&#10084;</span> by <span className="text-zinc-700 dark:text-zinc-300 font-bold">Aditya Raj</span> · ccidcop.in
            </p>
            <div className="h-px bg-zinc-200 dark:bg-white/10 flex-1 max-w-[120px]"></div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default DocsPage;