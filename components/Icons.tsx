
import React from 'react';
import { 
  BookOpen, 
  QrCode, 
  Scan, 
  User, 
  LogOut, 
  Plus, 
  Trash2, 
  X,
  CheckCircle,
  AlertCircle,
  Folder,
  ArrowRight,
  Database,
  Download,
  Clock,
  FileText,
  Menu,
  Globe,
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const Icons = {
  BookOpen,
  QrCode,
  Scan,
  User,
  LogOut,
  Plus,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Folder,
  ArrowRight,
  Database,
  Download,
  Clock,
  FileText,
  Menu,
  Globe,
  Github,
  Linkedin,
  Mail,
  ExternalLink,
  ChevronRight,
  Logo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      {...props}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#c084fc', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="50" className="fill-zinc-900 dark:fill-white" />
      <path 
        d="M30 30 H55 C65 30 70 35 70 45 C70 55 65 60 55 60 H45 V75 H30 V30 Z M45 48 H55 C58 48 60 46 60 45 C60 44 58 42 55 42 H45 V48 Z" 
        className="fill-white dark:fill-zinc-900"
      />
      <rect x="65" y="65" width="12" height="12" rx="3" fill="#10b981" />
    </svg>
  )
};
