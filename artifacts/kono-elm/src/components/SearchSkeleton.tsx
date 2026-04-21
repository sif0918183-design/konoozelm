'use client';

export default function SearchSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Skeleton Image */}
          <div className="h-48 skeleton" />
          
          {/* Skeleton Content */}
          <div className="p-4 space-y-3">
            <div className="h-5 skeleton rounded w-3/4" />
            <div className="h-4 skeleton rounded w-1/2" />
            <div className="h-4 skeleton rounded w-2/3" />
            
            {/* Skeleton Buttons */}
            <div className="flex gap-2 mt-4">
              <div className="flex-1 h-10 skeleton rounded-lg" />
              <div className="flex-1 h-10 skeleton rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}