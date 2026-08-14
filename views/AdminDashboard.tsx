
import React, { useState, useEffect, useMemo } from 'react';
import { deleteBook, addBook, getBooks, getAllTransactions, approveReturn, getBookTransactions, getStudents, updateStudent, deleteStudent, getUserTransactions, updateBookCategory } from '../services/dbService';
import { fetchBookByIsbn, IsbnInfo, bookCoverUrl } from '../services/isbnLookup';
import Scanner from '../components/Scanner';
import { Book, Student, Transaction, DashboardView } from '../types';
import { Icons } from '../components/Icons';
import { QRCodeCanvas } from 'qrcode.react';

// Book cover with graceful fallback to the generic book icon
const BookCover: React.FC<{ isbn?: string | null; size?: 'S' | 'M' | 'L'; boxClassName?: string; imgClassName?: string; iconSize?: string }> = ({ isbn, size, boxClassName, imgClassName, iconSize = 'w-4 h-4' }) => {
  const url = bookCoverUrl(isbn, (size ?? 'M') as 'S' | 'M' | 'L');
  const [failed, setFailed] = useState(false);
  if (!url || failed) {
    return (
      <div className={`flex items-center justify-center text-zinc-400 dark:text-zinc-600 ${boxClassName || ''}`}>
        <Icons.BookOpen className={iconSize} />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt="cover"
      onError={() => setFailed(true)}
      className={imgClassName || 'w-full h-full object-cover'}
    />
  );
};

const AdminDashboard: React.FC<{ onLogout: () => void; onExit: () => void }> = ({ onLogout, onExit }) => {
  const [view, setView] = useState<Exclude<DashboardView, 'settings'>>('directory');
  
  // Data
  const [books, setBooks] = useState<Book[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Users (tab) state
  const [selectedUser, setSelectedUser] = useState<Student | null>(null);
  const [editingUser, setEditingUser] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState({ student_id: '', name: '', email: '', phone: '' });
  const [editStatus, setEditStatus] = useState<{type: 'error'|'success'|'', msg: string}>({type: '', msg: ''});
  const [userHistory, setUserHistory] = useState<Transaction[]>([]);
  const [userHistoryOffset, setUserHistoryOffset] = useState(0);
  const [userHistoryHasMore, setUserHistoryHasMore] = useState(false);
  const [userHistoryLoading, setUserHistoryLoading] = useState(false);
  
  // Modal & Actions
  const [selectedBookForQr, setSelectedBookForQr] = useState<Book | null>(null);
  const [selectedBookDetail, setSelectedBookDetail] = useState<Book | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Book history (detail modal) state
  const [bookHistory, setBookHistory] = useState<Transaction[]>([]);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Book detail: editable Folder / Tag name
  const [editingCategory, setEditingCategory] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [isbn, setIsbn] = useState('');
  const [author, setAuthor] = useState('');
  const [isbnInfo, setIsbnInfo] = useState<IsbnInfo | null>(null);
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [showIsbnScanner, setShowIsbnScanner] = useState(false);
  const [formStatus, setFormStatus] = useState<{type: 'error'|'success'|'', msg: string}>({type: '', msg: ''});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (books.length === 0) setLoading(true);
      const [booksData, txData, studentsData] = await Promise.all([getBooks(), getAllTransactions(), getStudents()]);
      setBooks(booksData);
      setTransactions(txData);
      setStudents(studentsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Logic Helpers ---
  
  const pendingReturns = useMemo(() => 
    transactions.filter(t => t.status === 'ACTIVE' && t.return_date !== null),
  [transactions]);
  
  const overdueTransactions = useMemo(() => transactions.filter(t => {
      if (t.status !== 'ACTIVE' || t.return_date !== null) return false;
      const issueDate = new Date(t.issue_date);
      const diffTime = Math.abs(new Date().getTime() - issueDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays > 10;
  }), [transactions]);

  const activeIssues = useMemo(() => 
    transactions.filter(t => t.status === 'ACTIVE' && t.return_date === null),
  [transactions]);

  const filteredBooks = useMemo(() => {
    if (!searchTerm) return books;
    const lower = searchTerm.toLowerCase();
    return books.filter(b => 
        b.title.toLowerCase().includes(lower) || 
        b.category.toLowerCase().includes(lower) ||
        (b.unique_code || '').includes(lower) ||
        (b.isbn || '').includes(lower) ||
        (b.author || '').toLowerCase().includes(lower)
    );
  }, [books, searchTerm]);

  const groupedBooks = useMemo(() => {
    return filteredBooks.reduce<Record<string, Book[]>>((acc, book) => {
        const cat = book.category || 'UNCATEGORIZED';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(book);
        return acc;
    }, {});
  }, [filteredBooks]);

  const existingCategories = useMemo(() => {
    const cats = new Set(books.map(b => b.category));
    return Array.from(cats).sort();
  }, [books]);


  // --- Actions ---

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus({type: '', msg: ''});

    const isbnClean = isbn.trim().replace(/[-\s]/g, '');
    if (!isbnClean) {
      setFormStatus({type: 'error', msg: "ISBN is required. Scan the book barcode or type it manually."});
      return;
    }

    try {
      await addBook(title, category.toUpperCase(), isbnClean, {
        author: author.trim() || null,
        publisher: isbnInfo?.publisher || null,
        published: isbnInfo?.published || null,
        pages: isbnInfo?.pages ?? null,
        binding: isbnInfo?.binding || null,
      });
      setFormStatus({type: 'success', msg: `Added "${title}"`});
      setTitle('');
      setIsbn('');
      setAuthor('');
      setIsbnInfo(null);
      // Keep category for rapid entry of same type
      fetchData(); 
      setTimeout(() => {
        setFormStatus({type: '', msg: ''});
      }, 2000);
    } catch (err: any) {
      setFormStatus({type: 'error', msg: "Failed to add. Book with this ISBN might already exist."});
    }
  };

  const handleFetchIsbn = async (raw?: string) => {
    const isbnClean = (raw ?? isbn).trim().replace(/[-\s]/g, '');
    if (!isbnClean) {
      setFormStatus({type: 'error', msg: "Enter or scan an ISBN first."});
      return;
    }
    setFormStatus({type: '', msg: ''});
    setIsbnLoading(true);
    setIsbnInfo(null);
    try {
      const info = await fetchBookByIsbn(isbnClean);
      if (!info || !info.title) {
        setFormStatus({type: 'error', msg: `No book found for ISBN ${isbnClean}.`});
        return;
      }
      setIsbnInfo(info);
      setTitle(info.title);
      setAuthor(info.author);
      if (!category && (info.binding || info.publisher)) {
        setCategory(info.binding || info.publisher);
      }
    } catch {
      setFormStatus({type: 'error', msg: "Failed to reach the book database."});
    } finally {
      setIsbnLoading(false);
    }
  };

  const handleScanIsbnClick = () => {
    // Request camera permission inside the tap so the phone remembers the grant
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => stream.getTracks().forEach((t) => t.stop()))
      .catch(() => {});
    setShowIsbnScanner(true);
  };

  const handleIsbnScanned = (text: string) => {
    const clean = text.trim().replace(/[-\s]/g, '');
    if (!clean) return;
    setIsbn(clean);
    setShowIsbnScanner(false);
    handleFetchIsbn(clean);
  };

  const handleDeleteBook = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Prevent opening detail modal
    if (window.confirm('Delete this book permanently? All history for this book will also be removed.')) {
      try {
        await deleteBook(id);
        fetchData();
      } catch (e) {
        alert("Error deleting book. Ensure network connection is stable.");
      }
    }
  };

  const handleQrClick = (e: React.MouseEvent, book: Book) => {
    e.stopPropagation(); // Prevent opening detail modal
    setSelectedBookForQr(book);
  }

  // Load book history (last 3 first, then more on demand)
  useEffect(() => {
    if (!selectedBookDetail) return;
    let active = true;
    setEditingCategory(false);
    setBookHistory([]);
    setHistoryOffset(0);
    setHistoryHasMore(false);
    setHistoryLoading(true);
    getBookTransactions(selectedBookDetail.id, 3, 0)
      .then(({ data, hasMore }) => {
        if (!active) return;
        setBookHistory(data);
        setHistoryOffset(3);
        setHistoryHasMore(hasMore);
      })
      .catch(() => {})
      .finally(() => active && setHistoryLoading(false));
    return () => { active = false; };
  }, [selectedBookDetail]);

  const handleLoadMoreHistory = async () => {
    if (!selectedBookDetail || historyLoading) return;
    setHistoryLoading(true);
    try {
      const { data, hasMore } = await getBookTransactions(selectedBookDetail.id, 5, historyOffset);
      setBookHistory(prev => [...prev, ...data]);
      setHistoryOffset(prev => prev + data.length);
      setHistoryHasMore(hasMore);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleApproveReturn = async (tx: Transaction) => {
      try {
          await approveReturn(tx.id, tx.book_id);
          fetchData();
      } catch (e) {
          console.error("Failed to approve", e);
          alert("Failed to approve return");
      }
  };

  const handleEditCategoryClick = () => {
    if (!selectedBookDetail) return;
    setCategoryDraft(selectedBookDetail.category);
    setEditingCategory(true);
  };

  const handleSaveCategory = async () => {
    if (!selectedBookDetail) return;
    const newCat = categoryDraft.trim().toUpperCase() || selectedBookDetail.category;
    try {
      await updateBookCategory(selectedBookDetail.id, newCat);
      fetchData();
      setSelectedBookDetail(prev => prev ? { ...prev, category: newCat } : prev);
      setEditingCategory(false);
    } catch {
      alert("Failed to update folder name.");
    }
  };

  // --- Users (tab) logic ---

  const transactionCountFor = (studentId: number) =>
      transactions.filter(t => t.student_internal_id === studentId).length;

  const filteredStudents = useMemo(() => {
    if (!searchTerm) return students;
    const lower = searchTerm.toLowerCase();
    return students.filter(s =>
        s.name.toLowerCase().includes(lower) ||
        s.student_id.toLowerCase().includes(lower) ||
        s.email.toLowerCase().includes(lower) ||
        s.phone.toLowerCase().includes(lower)
    );
  }, [students, searchTerm]);

  // Load user history (last 3 first, then more on demand)
  useEffect(() => {
    if (!selectedUser) return;
    let active = true;
    setUserHistory([]);
    setUserHistoryOffset(0);
    setUserHistoryHasMore(false);
    setUserHistoryLoading(true);
    getUserTransactions(selectedUser.id, 3, 0)
      .then(({ data, hasMore }) => {
        if (!active) return;
        setUserHistory(data);
        setUserHistoryOffset(3);
        setUserHistoryHasMore(hasMore);
      })
      .catch(() => {})
      .finally(() => active && setUserHistoryLoading(false));
    return () => { active = false; };
  }, [selectedUser]);

  const handleLoadMoreUserHistory = async () => {
    if (!selectedUser || userHistoryLoading) return;
    setUserHistoryLoading(true);
    try {
      const { data, hasMore } = await getUserTransactions(selectedUser.id, 5, userHistoryOffset);
      setUserHistory(prev => [...prev, ...data]);
      setUserHistoryOffset(prev => prev + data.length);
      setUserHistoryHasMore(hasMore);
    } catch {
      // ignore
    } finally {
      setUserHistoryLoading(false);
    }
  };

  const openEditUser = (user: Student) => {
    setEditStatus({type: '', msg: ''});
    setEditForm({ student_id: user.student_id, name: user.name, email: user.email, phone: user.phone });
    setEditingUser(user);
  };

  const handleEditUserClick = (e: React.MouseEvent, user: Student) => {
    e.stopPropagation();
    openEditUser(user);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditStatus({type: '', msg: ''});
    if (!editForm.student_id.trim() || !editForm.name.trim()) {
      setEditStatus({type: 'error', msg: 'Student ID and Name are required.'});
      return;
    }
    try {
      await updateStudent(editingUser.id, {
        student_id: editForm.student_id.trim(),
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
      });
      setEditStatus({type: 'success', msg: 'Profile updated.'});
      fetchData();
      setSelectedUser(prev => prev ? { ...prev, ...editForm } : prev);
      setTimeout(() => { setEditingUser(null); setEditStatus({type: '', msg: ''}); }, 700);
    } catch {
      setEditStatus({type: 'error', msg: 'Failed to update. Student ID might be duplicate.'});
    }
  };

  const deleteUserById = async (user: Student) => {
    if (window.confirm(`Delete ${user.name} permanently? Their full transaction history will also be removed.`)) {
      try {
        await deleteStudent(user.id);
        fetchData();
        if (selectedUser?.id === user.id) setSelectedUser(null);
        if (editingUser?.id === user.id) setEditingUser(null);
      } catch {
        alert("Error deleting user. Ensure network connection is stable.");
      }
    }
  };

  const handleDeleteUser = (e: React.MouseEvent, user: Student) => {
    e.stopPropagation();
    deleteUserById(user);
  };

  const downloadQR = () => {
    const canvas = document.getElementById('qr-gen') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${selectedBookForQr?.title}_QR.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const getActiveTransactionForBook = (bookId: number) => {
      return activeIssues.find(t => t.book_id === bookId);
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 dark:bg-[#050505] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-indigo-500/30 pb-20 transition-colors duration-300 relative">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/5 blur-[120px] rounded-full mix-blend-multiply dark:mix-blend-screen"></div>
          <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-rose-500/5 dark:bg-rose-500/5 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen"></div>
      </div>

      {/* Top Header */}
      <header className="px-6 md:px-8 h-20 flex items-center justify-between border-b border-zinc-200 dark:border-white/5 sticky top-0 bg-white/80 dark:bg-[#050505]/80 backdrop-blur-2xl z-40 transition-colors supports-[backdrop-filter]:bg-white/60">
         <div className="flex items-center gap-6">
             <div className="flex items-center gap-3 group">
               <Icons.Logo className="w-10 h-10" />
               <h1 className="text-xl md:text-2xl font-black tracking-tighter font-mono select-none flex items-center gap-1">
                  <span className="text-zinc-900 dark:text-white">RECOLABS</span>
                  <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 dark:from-indigo-400 dark:via-violet-400 dark:to-indigo-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">_CORE</span>
               </h1>
             </div>
             <div className="h-5 w-px bg-zinc-200 dark:bg-white/10 rotate-12 hidden md:block"></div>
             <div className="hidden md:flex flex-col">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest leading-none">System</span>
                <span className="text-[10px] font-mono text-zinc-300 dark:text-zinc-600 leading-none">v2.0.4-stable</span>
             </div>
         </div>
         <div className="flex items-center gap-3">
            <button 
                onClick={fetchData}
                className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-white transition-all shadow-sm"
                title="Refresh Data"
            >
                <Icons.Database className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
             <button 
                 onClick={onExit}
                 className="hidden md:block px-5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 text-[10px] font-bold tracking-widest text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all uppercase shadow-sm"
             >
                 Close Panel
             </button>
             <button onClick={onLogout} className="px-5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-[10px] font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all uppercase tracking-widest flex items-center gap-2 shadow-sm">
                 <span className="hidden md:inline">Sign Out</span> <Icons.LogOut className="w-4 h-4" />
             </button>
         </div>
      </header>

      <main className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8 md:space-y-12 relative z-10">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-in slide-in-from-bottom-2 duration-500">
              {[
                  { label: 'Books Issued', val: activeIssues.length, color: 'text-zinc-900 dark:text-white', sub: 'Currently out', icon: Icons.BookOpen, gradient: 'from-blue-500/20 to-indigo-500/20' },
                  { label: 'Pending Returns', val: pendingReturns.length, color: 'text-amber-600 dark:text-amber-400', sub: 'Action required', icon: Icons.Clock, gradient: 'from-amber-500/20 to-orange-500/20' },
                  { label: 'Overdue Items', val: overdueTransactions.length, color: 'text-rose-600 dark:text-rose-500', sub: '> 10 Days late', icon: Icons.AlertCircle, gradient: 'from-rose-500/20 to-red-500/20' },
                  { label: 'Total Database', val: books.length, color: 'text-zinc-500 dark:text-zinc-400', sub: 'Registered Assets', icon: Icons.Database, gradient: 'from-zinc-500/20 to-gray-500/20' }
              ].map((stat, i) => (
                  <div key={i} className="relative overflow-hidden bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 p-6 rounded-2xl h-32 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-white/10 transition-all shadow-sm dark:shadow-none group hover:shadow-md dark:hover:shadow-white/5">
                      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.gradient} blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                      <div className="flex justify-between items-start relative z-10">
                          <span className="text-[11px] font-bold tracking-wider text-zinc-500 dark:text-zinc-500 uppercase font-mono">{stat.label}</span>
                          <stat.icon className="w-4 h-4 text-zinc-400 dark:text-zinc-700 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
                      </div>
                      <div className="flex items-baseline justify-between relative z-10">
                        <span className={`text-4xl font-medium tracking-tight ${stat.color}`}>{stat.val}</span>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono uppercase tracking-wide">{stat.sub}</p>
                      </div>
                  </div>
              ))}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-white/5 overflow-x-auto pb-px">
              {[
                  { id: 'directory', label: 'Asset Directory' },
                  { id: 'reviews', label: 'Review Queue', count: pendingReturns.length },
                  { id: 'overdue', label: 'Overdue Logs', count: overdueTransactions.length },
                  { id: 'users', label: 'Users', count: students.length },
              ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                        setView(tab.id as any);
                        setActiveCategory(null);
                        setSearchTerm('');
                    }}
                    className={`relative px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap rounded-t-lg ${view === tab.id ? 'text-zinc-900 dark:text-white bg-white dark:bg-white/5 border-x border-t border-zinc-200 dark:border-white/5 -mb-px z-10' : 'text-zinc-500 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 border border-transparent hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                  >
                      {tab.label}
                      {tab.count !== undefined && tab.count > 0 && (
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${tab.id === 'overdue' ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                              {tab.count}
                          </span>
                      )}
                  </button>
              ))}
          </div>

          {/* DIRECTORY VIEW */}
          {view === 'directory' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[500px]">
                  {!activeCategory ? (
                     <>
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                            <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs uppercase tracking-widest">
                                <Icons.Folder className="w-4 h-4" />
                                <span>Root Level</span>
                            </div>
                            
                            {/* Search */}
                            <div className="relative w-full md:w-96 group">
                                <Icons.Scan className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by ID, Name or Tag..." 
                                    className="w-full bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all font-mono shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {!searchTerm && (
                                <button 
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="group h-48 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 hover:border-indigo-500/50 bg-transparent hover:bg-indigo-500/5 transition-all flex flex-col items-center justify-center gap-4"
                                >
                                    <div className="p-4 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/20 transition-all shadow-sm group-hover:scale-110">
                                        <Icons.Plus className="w-6 h-6 text-zinc-400 dark:text-zinc-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-500 dark:text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 uppercase tracking-wide">New Folder / Item</span>
                                </button>
                            )}

                            {Object.entries(groupedBooks).map(([catName, catBooks]) => (
                                <div 
                                    key={catName}
                                    onClick={() => setActiveCategory(catName)}
                                    className="group h-48 relative bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/5 rounded-2xl p-6 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all cursor-pointer hover:-translate-y-1 shadow-sm dark:shadow-none hover:shadow-lg dark:hover:shadow-indigo-900/10 flex flex-col justify-between overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent blur-2xl rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-zinc-900 text-indigo-600 dark:text-indigo-500 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white transition-all border border-indigo-100 dark:border-white/5 shadow-sm">
                                            <Icons.Folder className="w-5 h-5" />
                                        </div>
                                        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 group-hover:text-indigo-500 transition-colors">DIR</span>
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1 uppercase tracking-tight font-mono truncate" title={catName}>{catName}</h3>
                                        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold tracking-wider uppercase">
                                            <Icons.Database className="w-3 h-3" />
                                            <span>{(catBooks as Book[]).length} Assets</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </>
                  ) : (
                      <div>
                          <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={() => setActiveCategory(null)}
                                        className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:border-zinc-300 transition-colors text-zinc-500 dark:text-zinc-400 shadow-sm"
                                    >
                                        <Icons.ArrowRight className="w-4 h-4 rotate-180" />
                                    </button>
                                    <div>
                                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white uppercase tracking-wide font-mono flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500">
                                                <Icons.Folder className="w-6 h-6" />
                                            </div>
                                            {activeCategory}
                                        </h2>
                                    </div>
                                </div>
                                <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest bg-zinc-100 dark:bg-zinc-900 px-3 py-1 rounded-md border border-zinc-200 dark:border-white/5">
                                    {groupedBooks[activeCategory!]?.length || 0} ITEMS
                                </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                              {groupedBooks[activeCategory!]?.map(book => (
                                  <div 
                                    key={book.id} 
                                    onClick={() => setSelectedBookDetail(book)}
                                    className="bg-white dark:bg-[#0A0A0A] p-5 rounded-xl border border-zinc-200 dark:border-white/5 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 group transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900/30 shadow-sm dark:shadow-none h-full flex flex-col cursor-pointer relative overflow-hidden"
                                  >
                                      <div className="flex justify-between items-start mb-4 relative z-10">
                                          <div className="w-12 h-16 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 shadow-sm shrink-0">
                                              <BookCover isbn={book.isbn} size="M" boxClassName="w-full h-full" imgClassName="w-full h-full object-cover" />
                                          </div>
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono tracking-wider ${book.status === 'AVAILABLE' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/20' : 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 border border-indigo-200 dark:border-indigo-500/20'}`}>
                                              {book.status === 'ISSUED' ? 'OUT' : 'IN STOCK'}
                                          </span>
                                      </div>
                                      <div className="flex-1 relative z-10">
                                          <h4 className="font-bold text-zinc-900 dark:text-white text-sm mb-1 line-clamp-2 leading-snug" title={book.title}>{book.title}</h4>
                                          <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono">ID: {book.unique_code || book.isbn || 'ISBN BOOK'}</p>
                                      </div>
                                      
                                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100 dark:border-white/5 relative z-10">
                                          <button onClick={(e) => handleQrClick(e, book)} className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors">
                                              <Icons.QrCode className="w-3 h-3" /> QR CODE
                                          </button>
                                          <button 
                                            onClick={(e) => handleDeleteBook(e, book.id)} 
                                            className="text-zinc-300 dark:text-zinc-700 hover:text-red-500 dark:hover:text-red-500 transition-colors p-1"
                                            title="Delete Book"
                                          >
                                              <Icons.Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          )}

          {/* REVIEWS VIEW */}
          {view === 'reviews' && (
              <div className="max-w-5xl mx-auto animate-in fade-in">
                  <div className="flex items-center justify-between mb-8">
                      <h2 className="text-lg font-bold flex items-center gap-3 text-zinc-900 dark:text-white uppercase tracking-wider">
                          <div className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"></div>
                          Pending Approvals
                      </h2>
                      <span className="text-xs font-mono text-zinc-500">{pendingReturns.length} Requests</span>
                  </div>
                  
                  {pendingReturns.length === 0 ? (
                      <div className="py-20 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20">
                          <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                             <Icons.CheckCircle className="w-8 h-8" />
                          </div>
                          <h3 className="text-zinc-900 dark:text-white font-bold text-sm uppercase tracking-wide">All Clear</h3>
                          <p className="text-zinc-500 dark:text-zinc-600 font-mono text-xs mt-2">No pending returns in queue.</p>
                      </div>
                  ) : (
                      <div className="border border-zinc-200 dark:border-white/5 rounded-2xl overflow-hidden bg-white dark:bg-[#0A0A0A] shadow-sm">
                          <div className="grid grid-cols-12 gap-4 p-4 border-b border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-bold uppercase tracking-widest text-zinc-500 font-mono">
                              <div className="col-span-4">Resource</div>
                              <div className="col-span-3">Student</div>
                              <div className="col-span-3">Submitted At</div>
                              <div className="col-span-2 text-right">Action</div>
                          </div>
                          <div className="divide-y divide-zinc-100 dark:divide-white/5">
                              {pendingReturns.map(tx => (
                                  <div key={tx.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                                      <div className="col-span-4">
                                          <p className="font-bold text-zinc-900 dark:text-white text-sm truncate pr-4">{tx.books?.title}</p>
                                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{tx.books?.category} // {tx.books?.unique_code || tx.books?.isbn || 'ISBN BOOK'}</p>
                                      </div>
                                      <div className="col-span-3">
                                          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{tx.students?.name || 'Unknown'}</p>
                                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {tx.students?.student_id}</p>
                                      </div>
                                      <div className="col-span-3">
                                           <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">{new Date(tx.return_date!).toLocaleDateString()}</p>
                                           <p className="text-[10px] text-zinc-400 font-mono">{new Date(tx.return_date!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                      </div>
                                      <div className="col-span-2 text-right">
                                          <button 
                                            onClick={() => handleApproveReturn(tx)}
                                            className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-sm"
                                          >
                                              Approve
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          )}

          {/* OVERDUE VIEW */}
          {view === 'overdue' && (
              <div className="max-w-5xl mx-auto animate-in fade-in">
                   <div className="flex items-center justify-between mb-8">
                      <h2 className="text-lg font-bold flex items-center gap-3 text-zinc-900 dark:text-white uppercase tracking-wider">
                          <div className="w-2 h-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                          Overdue Alerts
                      </h2>
                      <span className="text-xs font-mono text-zinc-500">{overdueTransactions.length} Alerts</span>
                  </div>

                  {overdueTransactions.length === 0 ? (
                      <div className="py-20 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20">
                           <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                             <Icons.CheckCircle className="w-8 h-8" />
                          </div>
                           <h3 className="text-zinc-900 dark:text-white font-bold text-sm uppercase tracking-wide">System Optimal</h3>
                           <p className="text-zinc-500 dark:text-zinc-600 font-mono text-xs mt-2">No overdue items in ecosystem.</p>
                      </div>
                  ) : (
                      <div className="space-y-3">
                          {overdueTransactions.map(tx => {
                              const issueDate = new Date(tx.issue_date);
                              const diffTime = Math.abs(new Date().getTime() - issueDate.getTime());
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

                              return (
                                <div key={tx.id} className="bg-white dark:bg-[#0A0A0A] border border-l-4 border-l-rose-500 border-y-zinc-200 dark:border-y-white/5 border-r-zinc-200 dark:border-r-white/5 p-5 rounded-r-xl flex items-center justify-between hover:shadow-md dark:hover:shadow-rose-900/10 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 flex items-center justify-center font-bold text-sm">
                                            {diffDays}d
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-zinc-900 dark:text-white text-sm">{tx.students?.name || 'Unknown Student'}</h3>
                                            <p className="text-xs text-zinc-500 uppercase font-mono tracking-wide mt-0.5">ID: {tx.students?.student_id}</p>
                                        </div>
                                        <div className="hidden sm:block h-8 w-px bg-zinc-100 dark:bg-white/10 mx-2"></div>
                                        <div className="hidden sm:block">
                                             <p className="text-sm font-medium text-zinc-900 dark:text-zinc-300">{tx.books?.title}</p>
                                             <p className="text-[10px] text-zinc-400 font-mono uppercase">Ref: {tx.books?.unique_code || tx.books?.isbn || 'ISBN BOOK'}</p>
                                        </div>
                                    </div>
                                    <button className="text-[10px] font-bold uppercase tracking-wider text-rose-600 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300 border border-rose-200 dark:border-rose-500/30 px-4 py-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                                        Send Notice
                                    </button>
                                </div>
                              );
                          })}
                      </div>
                  )}
              </div>
          )}

          {/* USERS VIEW */}
          {view === 'users' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[500px]">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                      <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs uppercase tracking-widest">
                          <Icons.User className="w-4 h-4" />
                          <span>Registered Users</span>
                      </div>
                      
                      {/* Search */}
                      <div className="relative w-full md:w-96 group">
                          <Icons.Scan className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-600 group-focus-within:text-indigo-500 transition-colors" />
                          <input 
                              type="text" 
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="Search by ID, Name, Email or Phone..." 
                              className="w-full bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all font-mono shadow-sm"
                          />
                      </div>
                  </div>

                  {students.length === 0 && !loading ? (
                      <div className="py-20 text-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/20">
                          <div className="w-16 h-16 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                              <Icons.User className="w-8 h-8" />
                          </div>
                          <h3 className="text-zinc-900 dark:text-white font-bold text-sm uppercase tracking-wide">No Registered Users</h3>
                          <p className="text-zinc-500 dark:text-zinc-600 font-mono text-xs mt-2">Students appear here once they use the kiosk.</p>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {filteredStudents.map(student => (
                              <div 
                                key={student.id} 
                                onClick={() => setSelectedUser(student)}
                                className="bg-white dark:bg-[#0A0A0A] p-5 rounded-xl border border-zinc-200 dark:border-white/5 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 group transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900/30 shadow-sm dark:shadow-none h-full flex flex-col cursor-pointer relative overflow-hidden"
                              >
                                  <div className="flex justify-between items-start mb-4 relative z-10">
                                      <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                          {student.name.trim().charAt(0).toUpperCase() || 'U'}
                                      </div>
                                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold font-mono uppercase tracking-wider ${
                                          transactionCountFor(student.id) > 0
                                          ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/20'
                                          : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-500 border border-zinc-200 dark:border-white/5'
                                      }`}>
                                          {transactionCountFor(student.id)} TXNS
                                      </span>
                                  </div>
                                  <div className="flex-1 relative z-10">
                                      <h4 className="font-bold text-zinc-900 dark:text-white text-sm mb-1 truncate" title={student.name}>{student.name}</h4>
                                      <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono">ID: {student.student_id}</p>
                                      <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono truncate mt-0.5">{student.email || '—'}</p>
                                      <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono">{student.phone || '—'}</p>
                                  </div>
                                  
                                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-100 dark:border-white/5 relative z-10">
                                      <button 
                                          onClick={(e) => handleEditUserClick(e, student)}
                                          className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
                                      >
                                          <Icons.ExternalLink className="w-3 h-3" /> EDIT
                                      </button>
                                      <button 
                                          onClick={(e) => handleDeleteUser(e, student)} 
                                          className="text-zinc-300 dark:text-zinc-700 hover:text-red-500 dark:hover:text-red-500 transition-colors p-1"
                                          title="Delete User"
                                      >
                                          <Icons.Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

      </main>

      {/* ADD BOOK MODAL */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/10 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl">
                  <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-white transition-colors">
                      <Icons.X className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-3 mb-8">
                      <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                          <Icons.Plus className="w-5 h-5 text-zinc-900 dark:text-white" />
                      </div>
                      <div>
                          <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wide font-mono">Add Resource</h2>
                          <p className="text-xs text-zinc-500 font-mono">Create new database entry</p>
                      </div>
                  </div>
                  
                  <form onSubmit={handleAddBook} className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 font-mono">Title</label>
                        <input 
                            type="text" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-sm text-zinc-900 dark:text-white focus:border-indigo-500 outline-none transition-colors font-medium"
                            placeholder="Resource Title"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 font-mono">ISBN</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={isbn} 
                                maxLength={17}
                                onChange={e => setIsbn(e.target.value)}
                                className="flex-1 min-w-0 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-sm text-zinc-900 dark:text-white focus:border-indigo-500 outline-none transition-colors font-mono"
                                placeholder="978-3-16-148410-0"
                                required
                            />
                            <button 
                                type="button"
                                onClick={handleScanIsbnClick}
                                className="px-4 py-3 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:border-indigo-500/50 text-zinc-600 dark:text-zinc-300 transition-colors"
                                title="Scan ISBN barcode"
                            >
                                <Icons.QrCode className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => handleFetchIsbn()}
                        disabled={isbnLoading}
                        className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all uppercase tracking-widest text-xs shadow-lg disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
                    >
                        {isbnLoading ? (
                            <>
                                <Icons.Clock className="w-4 h-4 animate-spin" /> Fetching Book Info...
                            </>
                        ) : (
                            <>
                                <Icons.Database className="w-4 h-4" /> Fetch Book Info
                            </>
                        )}
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 font-mono">Folder / Tag</label>
                             <input 
                                type="text" 
                                value={category} 
                                onChange={e => setCategory(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-sm text-zinc-900 dark:text-white focus:border-indigo-500 outline-none transition-colors uppercase font-mono"
                                placeholder="CATEGORY"
                                required
                            />
                        </div>
                        <div>
                             <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 font-mono">Author <span className="text-zinc-400 font-normal normal-case">(auto)</span></label>
                             <input 
                                type="text" 
                                value={author} 
                                onChange={e => setAuthor(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-sm text-zinc-900 dark:text-white focus:border-indigo-500 outline-none transition-colors"
                                placeholder="Book Author"
                            />
                        </div>
                    </div>

                    {isbnInfo && (
                        <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-900 p-4 flex gap-4">
                            {isbnInfo.coverUrl && (
                                <img 
                                    src={isbnInfo.coverUrl} 
                                    alt="cover" 
                                    className="w-16 h-24 object-cover rounded-lg border border-zinc-200 dark:border-white/10 shadow-md shrink-0"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            )}
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1 font-mono">Fetched Details</p>
                                <p className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">{isbnInfo.title}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    {[isbnInfo.author, isbnInfo.publisher, isbnInfo.published, isbnInfo.pages ? `${isbnInfo.pages} pages` : null, isbnInfo.binding].filter(Boolean).join(' • ')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Existing Tags Quick Select */}
                    {existingCategories.length > 0 && (
                        <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-2 font-mono">Existing Tags</label>
                            <div className="flex flex-wrap gap-2">
                                {existingCategories.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold border transition-all uppercase font-mono ${category === cat ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-zinc-500 hover:border-indigo-500 hover:text-indigo-500'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {formStatus.msg && (
                        <div className={`p-3 rounded-lg text-xs font-bold font-mono border text-center ${formStatus.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'}`}>
                            {formStatus.msg}
                        </div>
                    )}

                    <button type="submit" className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all uppercase tracking-widest text-xs shadow-lg mt-4">
                        Confirm Entry
                    </button>
                  </form>
              </div>
          </div>
      )}
      
      {/* ISBN SCANNER OVERLAY */}
      {showIsbnScanner && (
        <Scanner onScan={handleIsbnScanned} onClose={() => setShowIsbnScanner(false)} />
      )}

      {/* QR MODAL */}
      {selectedBookForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 max-w-sm w-full text-center relative shadow-2xl">
                <button onClick={() => setSelectedBookForQr(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900 dark:text-zinc-500 dark:hover:text-white transition-colors">
                    <Icons.X className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1 line-clamp-1">{selectedBookForQr.title}</h3>
                <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-8">{selectedBookForQr.category} // {selectedBookForQr.unique_code || selectedBookForQr.isbn || 'ISBN BOOK'}</p>
                {selectedBookForQr.unique_code ? (
                    <>
                        <div className="bg-white p-4 rounded-2xl inline-block mb-8 shadow-inner border border-zinc-100 dark:border-transparent">
                             <QRCodeCanvas id="qr-gen" value={selectedBookForQr.unique_code} size={180} level={"H"} />
                        </div>
                        <button onClick={downloadQR} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2 uppercase text-xs tracking-widest shadow-lg">
                            <Icons.Download className="w-4 h-4" /> Save Asset QR
                        </button>
                    </>
                ) : (
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 mb-4">
                        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">ISBN-registered book</p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-1">No QR code. Students scan the ISBN barcode on the book or type the ISBN.</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* BOOK DETAILS MODAL */}
      {selectedBookDetail && (
        <div onClick={() => setSelectedBookDetail(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/10 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
                 <button onClick={() => setSelectedBookDetail(null)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-white transition-colors">
                    <Icons.X className="w-5 h-5" />
                </button>

                <div className="mb-6 flex gap-5">
                     <div className="w-24 h-32 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 shadow-md shrink-0">
                         <BookCover isbn={selectedBookDetail.isbn} size="L" boxClassName="w-full h-full" imgClassName="w-full h-full object-cover" />
                     </div>
                     <div className="min-w-0">
                         <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">{selectedBookDetail.title}</h2>
                         <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{selectedBookDetail.category} // {selectedBookDetail.unique_code || selectedBookDetail.isbn || 'ISBN BOOK'}</span>
                         </div>
                     </div>
                </div>

                {selectedBookDetail.status === 'AVAILABLE' ? (
                     <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-center">
                         <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-wider text-xs mb-1">
                             <Icons.CheckCircle className="w-4 h-4" /> Available
                         </div>
                         <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500/70 font-mono">Item is currently in the library.</p>
                     </div>
                ) : (
                    <div className="space-y-4">
                         <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-center">
                             <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-500 font-bold uppercase tracking-wider text-xs mb-1">
                                 <Icons.Clock className="w-4 h-4" /> Currently Issued
                             </div>
                         </div>
                         
                         {(() => {
                             const tx = getActiveTransactionForBook(selectedBookDetail.id);
                             if (tx) {
                                 return (
                                     <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-white/5 space-y-3">
                                         <div>
                                             <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Issued To</label>
                                             <p className="text-sm font-bold text-zinc-900 dark:text-white">{tx.students?.name}</p>
                                         </div>
                                         <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Student ID</label>
                                                <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300">{tx.students?.student_id}</p>
                                            </div>
                                             <div>
                                                <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Issue Date</label>
                                                <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300">{new Date(tx.issue_date).toLocaleDateString()}</p>
                                            </div>
                                         </div>
                                          <div>
                                             <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Contact</label>
                                             <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate">{tx.students?.email}</p>
                                             <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{tx.students?.phone}</p>
                                         </div>
                                     </div>
                                 );
                             } else {
                                 return <p className="text-center text-xs text-zinc-500">Transaction details unavailable.</p>
                             }
                         })()}
                    </div>
                )}

                {/* Full Book Info */}
                <div className="mt-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3 font-mono">Book Details</p>
                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 divide-y divide-zinc-100 dark:divide-white/5">
                        {[
                            ['ISBN', selectedBookDetail.isbn],
                            ['Author', selectedBookDetail.author],
                            ['Publisher', selectedBookDetail.publisher],
                            ['Published', selectedBookDetail.published],
                            ['Pages', selectedBookDetail.pages != null ? String(selectedBookDetail.pages) : null],
                            ['Binding', selectedBookDetail.binding],
                            ['Added', new Date(selectedBookDetail.created_at).toLocaleDateString()],
                        ].map(([label, value]) => (
                            <div key={label} className="flex items-center justify-between px-4 py-2.5 gap-4">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 font-mono shrink-0">{label}</span>
                                <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 text-right truncate">{value || '—'}</span>
                            </div>
                        ))}
                        <div className="flex items-center justify-between px-4 py-2.5 gap-4">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 font-mono shrink-0">Folder / Tag</span>
                            {editingCategory ? (
                                <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                                    <input
                                        type="text"
                                        value={categoryDraft}
                                        onChange={e => setCategoryDraft(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleSaveCategory(); if (e.key === 'Escape') setEditingCategory(false); }}
                                        className="w-32 bg-white dark:bg-black border border-indigo-500/50 rounded-lg px-2 py-1 text-xs font-mono uppercase text-zinc-900 dark:text-white outline-none"
                                        autoFocus
                                    />
                                    <button onClick={handleSaveCategory} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Save">
                                        <Icons.CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => setEditingCategory(false)} className="p-1.5 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors" title="Cancel">
                                        <Icons.X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <span className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 text-right truncate uppercase">{selectedBookDetail.category || '—'}</span>
                                    <button onClick={handleEditCategoryClick} className="p-1.5 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Rename Folder">
                                        <Icons.ExternalLink className="w-3 h-3" />
                                    </button>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Book History */}
                <div className="mt-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3 font-mono">Issue / Return History</p>
                    {historyLoading && bookHistory.length === 0 ? (
                        <p className="text-center text-xs text-zinc-500 py-6">Loading history...</p>
                    ) : bookHistory.length === 0 ? (
                        <p className="text-center text-xs text-zinc-500 py-6">No transaction history for this book yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {bookHistory.map(tx => (
                                <div key={tx.id} className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-white/5">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{tx.students?.name || 'Student'}</p>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border shrink-0 ${
                                            tx.status === 'ACTIVE'
                                            ? 'text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10'
                                            : 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10'
                                        }`}>
                                            {tx.return_date && tx.status === 'ACTIVE' ? 'PENDING REVIEW' : tx.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                                        <div>
                                            <span className="text-zinc-400 uppercase tracking-widest block">Student ID</span>
                                            <span className="text-zinc-700 dark:text-zinc-300">{tx.students?.student_id}</span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-400 uppercase tracking-widest block">Issued</span>
                                            <span className="text-zinc-700 dark:text-zinc-300">{new Date(tx.issue_date).toLocaleDateString()}</span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-400 uppercase tracking-widest block">Returned</span>
                                            <span className="text-zinc-700 dark:text-zinc-300">{tx.return_date ? new Date(tx.return_date).toLocaleDateString() : '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {historyHasMore && (
                                <button
                                    onClick={handleLoadMoreHistory}
                                    disabled={historyLoading}
                                    className="w-full py-3 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:border-indigo-500/50 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                                >
                                    {historyLoading ? 'Loading...' : 'Load More'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* USER PROFILE MODAL */}
      {selectedUser && (
        <div onClick={() => setSelectedUser(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/10 rounded-3xl w-full max-w-lg p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
                 <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-white transition-colors">
                    <Icons.X className="w-5 h-5" />
                </button>

                <div className="mb-6">
                     <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 mb-4 text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                         {selectedUser.name.trim().charAt(0).toUpperCase() || 'U'}
                     </div>
                     <h2 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">{selectedUser.name}</h2>
                     <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1">ID: {selectedUser.student_id}</p>
                </div>

                {/* User Info */}
                <div className="mt-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3 font-mono">Profile</p>
                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-white/5 divide-y divide-zinc-100 dark:divide-white/5">
                        {[
                            ['Student ID', selectedUser.student_id],
                            ['Email', selectedUser.email],
                            ['Phone', selectedUser.phone],
                            ['Registered', new Date(selectedUser.created_at).toLocaleDateString()],
                            ['Transactions', String(transactionCountFor(selectedUser.id))],
                        ].map(([label, value]) => (
                            <div key={label} className="flex items-center justify-between px-4 py-2.5 gap-4">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 font-mono shrink-0">{label}</span>
                                <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 text-right truncate">{value || '—'}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={() => openEditUser(selectedUser)}
                            className="flex-1 py-3 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all"
                        >
                            Edit Profile
                        </button>
                        <button
                            onClick={() => deleteUserById(selectedUser)}
                            className="px-5 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                        >
                            Delete
                        </button>
                    </div>
                </div>

                {/* User Transaction History */}
                <div className="mt-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3 font-mono">Transaction History</p>
                    {userHistoryLoading && userHistory.length === 0 ? (
                        <p className="text-center text-xs text-zinc-500 py-6">Loading history...</p>
                    ) : userHistory.length === 0 ? (
                        <p className="text-center text-xs text-zinc-500 py-6">No transactions for this user yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {userHistory.map(tx => (
                                <div key={tx.id} className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 border border-zinc-200 dark:border-white/5">
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{tx.books?.title || 'Book'}</p>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border shrink-0 ${
                                            tx.status === 'ACTIVE'
                                            ? 'text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10'
                                            : 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10'
                                        }`}>
                                            {tx.return_date && tx.status === 'ACTIVE' ? 'PENDING REVIEW' : tx.status}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 font-mono uppercase mb-2">Ref: {tx.books?.unique_code || tx.books?.isbn || 'ISBN BOOK'}</p>
                                    <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                                        <div>
                                            <span className="text-zinc-400 uppercase tracking-widest block">Issued</span>
                                            <span className="text-zinc-700 dark:text-zinc-300">{new Date(tx.issue_date).toLocaleDateString()}</span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-400 uppercase tracking-widest block">Returned</span>
                                            <span className="text-zinc-700 dark:text-zinc-300">{tx.return_date ? new Date(tx.return_date).toLocaleDateString() : '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {userHistoryHasMore && (
                                <button
                                    onClick={handleLoadMoreUserHistory}
                                    disabled={userHistoryLoading}
                                    className="w-full py-3 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:border-indigo-500/50 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
                                >
                                    {userHistoryLoading ? 'Loading...' : 'Load More'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
              <div className="bg-white dark:bg-[#0A0A0A] border border-zinc-200 dark:border-white/10 rounded-3xl w-full max-w-md p-8 relative shadow-2xl">
                  <button onClick={() => setEditingUser(null)} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-white transition-colors">
                      <Icons.X className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-3 mb-8">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                          <Icons.User className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                          <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-wide font-mono">Edit User</h2>
                          <p className="text-xs text-zinc-500 font-mono">Correct profile information</p>
                      </div>
                  </div>
                  
                  <form onSubmit={handleSaveUser} className="space-y-5">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 font-mono">Student ID</label>
                        <input 
                            type="text" 
                            value={editForm.student_id} 
                            onChange={e => setEditForm({...editForm, student_id: e.target.value})}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-sm text-zinc-900 dark:text-white focus:border-indigo-500 outline-none transition-colors font-mono"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 font-mono">Name</label>
                        <input 
                            type="text" 
                            value={editForm.name} 
                            onChange={e => setEditForm({...editForm, name: e.target.value})}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-sm text-zinc-900 dark:text-white focus:border-indigo-500 outline-none transition-colors font-medium"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 font-mono">Email</label>
                             <input 
                                type="email" 
                                value={editForm.email} 
                                onChange={e => setEditForm({...editForm, email: e.target.value})}
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-sm text-zinc-900 dark:text-white focus:border-indigo-500 outline-none transition-colors"
                            />
                        </div>
                        <div>
                             <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 font-mono">Phone</label>
                             <input 
                                type="text" 
                                value={editForm.phone} 
                                onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl p-3 text-sm text-zinc-900 dark:text-white focus:border-indigo-500 outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {editStatus.msg && (
                        <div className={`p-3 rounded-lg text-xs font-bold font-mono border text-center ${editStatus.type === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'}`}>
                            {editStatus.msg}
                        </div>
                    )}

                    <button type="submit" className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-bold rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all uppercase tracking-widest text-xs shadow-lg mt-4">
                        Save Changes
                    </button>
                  </form>
              </div>
          </div>
      )}

    </div>
  );
};

export default AdminDashboard;
