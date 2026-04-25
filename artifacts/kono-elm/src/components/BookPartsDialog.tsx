'use client';

import { useRouter } from 'next/navigation';
import { X, BookOpen, Download } from 'lucide-react';
import type { Book, BookFile } from '@/lib/archive-api';
import { formatBytes } from '@/lib/utils';
import { translations } from '@/lib/translations';
import { usePathname } from 'next/navigation';

interface BookPartsDialogProps {
  book: Book;
  files: BookFile[];
  onClose: () => void;
  mode: 'read' | 'download';
  onDownload?: (file: BookFile) => void;
}

export default function BookPartsDialog({ book, files, onClose, mode, onDownload }: BookPartsDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isEnglish = pathname?.startsWith('/en');
  const lang = isEnglish ? 'en' : 'ar';
  const t = translations[lang];

  const handleAction = (file: BookFile) => {
    if (mode === 'download' && onDownload) {
      onDownload(file);
    } else {
      const readerUrl = `/reader?pdf=${encodeURIComponent(file.url)}&title=${encodeURIComponent(book.title)} - ${file.name}`;
      router.push(readerUrl);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir={isEnglish ? 'ltr' : 'rtl'}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 bg-primary-900 text-white flex items-center justify-between">
          <h3 className={`font-bold text-lg truncate flex-1 ${isEnglish ? 'mr-4' : 'ml-4'}`}>
            {mode === 'read' ? t.select_part_read : t.select_part_download}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-1">{t.book_label}:</p>
            <p className="font-bold text-primary-900 line-clamp-2">{book.title}</p>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {files.map((file, index) => (
              <button
                key={index}
                onClick={() => handleAction(file)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-primary-50 hover:border-primary-200 transition-all ${isEnglish ? 'text-left' : 'text-right'} group`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-800 group-hover:text-primary-900">
                      {file.name}
                    </span>
                    {file.size && (
                      <span className="text-[10px] text-gray-400">
                        {formatBytes(file.size)}
                      </span>
                    )}
                  </div>
                </div>
                {mode === 'read' ? (
                  <BookOpen className="w-5 h-5 text-primary-600" />
                ) : (
                  <Download className="w-5 h-5 text-gold-600" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
