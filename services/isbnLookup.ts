export interface IsbnInfo {
  title: string;
  author: string;
  publisher: string;
  published: string;
  pages: number | null;
  binding: string;
  coverUrl: string | null;
}

const cleanIsbn = (isbn: string) => isbn.replace(/[-\s]/g, '');

// Cover image for a book by ISBN (OpenLibrary covers API). Returns null when
// the book has no ISBN. `?default=false` makes missing covers 404 so the
// onError fallback can kick in.
export const bookCoverUrl = (isbn: string | null | undefined, size: 'S' | 'M' | 'L' = 'M'): string | null => {
  if (!isbn) return null;
  const clean = cleanIsbn(isbn);
  if (!clean) return null;
  return `https://covers.openlibrary.org/b/isbn/${clean}-${size}.jpg?default=false`;
};

// Free ISBN lookup via Open Library (CORS-enabled). isbnsearch.org returns
// HTML without CORS headers so it cannot be called from a browser.
export const fetchBookByIsbn = async (isbn: string): Promise<IsbnInfo | null> => {
  const clean = cleanIsbn(isbn);
  if (!/^\d{9}[\dX]$|^\d{13}$/.test(clean)) return null;

  try {
    const res = await fetch(`https://openlibrary.org/isbn/${clean}.json`);
    if (!res.ok) return null;
    const data = await res.json();

    let author = '';
    try {
      const authorKey = data.authors?.[0]?.key;
      if (authorKey) {
        const authorRes = await fetch(`https://openlibrary.org${authorKey}.json`);
        if (authorRes.ok) author = (await authorRes.json()).name || '';
      }
    } catch {
      // author lookup is best-effort
    }

    return {
      title: data.title || '',
      author,
      publisher: Array.isArray(data.publishers) ? data.publishers[0] || '' : '',
      published: data.publish_date || '',
      pages: data.number_of_pages ?? null,
      binding: data.physical_format || '',
      coverUrl: data.covers?.[0] ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg` : null,
    };
  } catch {
    return null;
  }
};