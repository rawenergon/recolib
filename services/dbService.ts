
import { supabase } from './supabaseClient';
import { Book, Student, Transaction } from '../types';

// Admin: Add Book
export const addBook = async (title: string, category: string, unique_code: string) => {
  const { data, error } = await supabase
    .from('books')
    .insert([{ title, category, unique_code, status: 'AVAILABLE' }])
    .select()
    .single();
  
  if (error) throw error;
  return data as Book;
};

// Admin: Get All Books
export const getBooks = async () => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Book[];
};

// Admin: Get All Transactions (Active & History)
export const getAllTransactions = async () => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, books(*), students(*)')
    .order('issue_date', { ascending: false });
    
  if (error) throw error;
  return data as Transaction[];
};

// Admin: Delete Book
export const deleteBook = async (id: number) => {
  // 1. Manual cascade: Delete transactions referencing this book first
  // This prevents Foreign Key errors when deleting a book with history
  const { error: txError } = await supabase
    .from('transactions')
    .delete()
    .eq('book_id', id);

  if (txError) throw txError;

  // 2. Delete the book itself
  const { error } = await supabase
    .from('books')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
};

// Admin: Approve Return (Mark as Submitted)
export const approveReturn = async (transactionId: number, bookId: number) => {
    // 1. Mark transaction as fully returned
    const { error: txError } = await supabase
        .from('transactions')
        .update({ status: 'RETURNED' })
        .eq('id', transactionId);

    if (txError) throw txError;

    // 2. Mark book as available
    const { error: bookError } = await supabase
        .from('books')
        .update({ status: 'AVAILABLE' })
        .eq('id', bookId);
    
    if (bookError) throw bookError;

    return true;
}

// Common: Get Book by Code
export const getBookByCode = async (code: string) => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('unique_code', code)
    .single();

  if (error) return null; // Not found
  return data as Book;
};

// Student: Get Student by ID
export const getStudentById = async (studentId: string) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('student_id', studentId)
    .single();
  
  if (error) return null;
  return data as Student;
};

// Student: Create Student
export const createStudent = async (studentId: string, name: string, email: string, phone: string) => {
  const { data, error } = await supabase
    .from('students')
    .insert([{ student_id: studentId, name, email, phone }])
    .select()
    .single();
  
  if (error) throw error;
  return data as Student;
};

// Transaction: Issue Book
export const issueBook = async (bookId: number, studentInternalId: number) => {
  // 1. Create transaction
  const { error: txError } = await supabase
    .from('transactions')
    .insert([{
      book_id: bookId,
      student_internal_id: studentInternalId,
      status: 'ACTIVE'
    }]);
  
  if (txError) throw txError;

  // 2. Update book status
  const { error: bookError } = await supabase
    .from('books')
    .update({ status: 'ISSUED' })
    .eq('id', bookId);

  if (bookError) throw bookError;

  return true;
};

// Transaction: Return Book (Student Action - Marks for Review)
export const returnBook = async (bookId: number) => {
  // 1. Find active transaction
  const { data: tx, error: findError } = await supabase
    .from('transactions')
    .select('*, students(*)')
    .eq('book_id', bookId)
    .eq('status', 'ACTIVE')
    .single();
    
  if (findError || !tx) throw new Error("No active transaction found for this book.");

  // 2. Update transaction with return date ONLY (Status stays ACTIVE until admin approves)
  const { error: txError } = await supabase
    .from('transactions')
    .update({ return_date: new Date().toISOString() })
    .eq('id', tx.id);
  
  if (txError) throw txError;

  return { success: true, studentName: tx.students?.name || 'Student' };
};
