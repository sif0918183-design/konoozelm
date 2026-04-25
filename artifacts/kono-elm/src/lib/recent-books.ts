/**
 * Management of recently read books in localStorage
 */

export interface RecentBook {
  identifier: string;
  title: string;
  url: string;
  lastRead: string; // ISO date
  currentPage: number;
  totalPages: number;
  isPinned?: boolean;
}

const STORAGE_KEY = 'recentBooks';
const MAX_RECENT = 10;

export function getRecentBooks(): RecentBook[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error('Error parsing recent books:', e);
    return [];
  }
}

export function addToRecentBooks(book: RecentBook): void {
  if (typeof window === 'undefined') return;

  let recent = getRecentBooks();

  // Check if book already exists
  const existingIndex = recent.findIndex(b => b.url === book.url);

  if (existingIndex !== -1) {
    // Preserve pinned status if it exists
    const existingBook = recent[existingIndex];
    const updatedBook = {
      ...book,
      isPinned: existingBook.isPinned
    };
    // Move to front
    recent.splice(existingIndex, 1);
    recent.unshift(updatedBook);
  } else {
    // Add to front
    recent.unshift(book);
  }

  // Maintain limit while respecting pinned books
  if (recent.length > MAX_RECENT) {
    // Separate pinned and unpinned
    const pinned = recent.filter(b => b.isPinned);
    const unpinned = recent.filter(b => !b.isPinned);

    // How many unpinned can we keep?
    const unpinnedToKeep = Math.max(0, MAX_RECENT - pinned.length);

    // Combine pinned with the latest unpinned
    recent = [...pinned, ...unpinned.slice(0, unpinnedToKeep)];

    // Sort by lastRead desc to ensure UI is consistent
    recent.sort((a, b) => new Date(b.lastRead).getTime() - new Date(a.lastRead).getTime());
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
}

export function togglePinBook(url: string): void {
  if (typeof window === 'undefined') return;
  const recent = getRecentBooks();
  const book = recent.find(b => b.url === url);
  if (book) {
    book.isPinned = !book.isPinned;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  }
}

export function removeFromRecent(url: string): void {
  if (typeof window === 'undefined') return;
  const recent = getRecentBooks();
  const filtered = recent.filter(b => b.url !== url);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}
