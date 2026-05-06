'use client';

export default function SearchSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden border border-primary-900/5">
          <div className="p-5 sm:p-6">
            <div className="flex flex-row gap-5 mb-5">
              {/* Skeleton Image */}
              <div className="w-28 sm:w-32 h-40 sm:h-44 skeleton rounded-2xl flex-shrink-0" />

              {/* Skeleton Content */}
              <div className="flex flex-col flex-1 py-1 space-y-3">
                <div className="h-5 skeleton rounded w-full" />
                <div className="h-5 skeleton rounded w-3/4" />
                <div className="mt-auto">
                  <div className="h-4 skeleton rounded w-1/2 mb-2" />
                  <div className="h-4 skeleton rounded w-2/3" />
                </div>
              </div>
            </div>

            {/* Skeleton Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-50">
              <div className="flex-1 h-12 skeleton rounded-2xl" />
              <div className="w-12 h-12 skeleton rounded-2xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}