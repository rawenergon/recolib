
export interface Book {
  id: number;
  created_at: string;
  title: string;
  category: string; // The "Folder" e.g., COMIC, MATH
  unique_code: string; // The 4 digit admin assigned code
  status: 'AVAILABLE' | 'ISSUED';
}

export interface Student {
  id: number;
  student_id: string; // The ID entered by student
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  book_id: number;
  student_internal_id: number;
  issue_date: string;
  return_date: string | null;
  status: 'ACTIVE' | 'RETURNED';
  books?: Book; // Joined
  students?: Student; // Joined
}

export type DashboardView = 'directory' | 'reviews' | 'overdue' | 'settings';
