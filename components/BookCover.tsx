import React, { useState } from 'react';
import { bookCoverUrl } from '../services/isbnLookup';
import { Icons } from './Icons';

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

export default BookCover;