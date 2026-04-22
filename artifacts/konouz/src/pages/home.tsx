import { useState, FormEvent, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Search, BookOpen, Download, Book, Activity, History, ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchBooks, usePopularSearches, useSearchStats, getSearchBooksQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function Home() {
  const [location, setLocation] = useLocation();
  const searchString = useSearch();
  
  // Parse URL search params
  const searchParams = new URLSearchParams(searchString);
  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  // Queries
  const { data: searchResults, isLoading: isSearchLoading, isError: isSearchError } = useSearchBooks(
    { q, page, rows: 24 },
    { query: { enabled: q.length > 0, queryKey: getSearchBooksQueryKey({ q, page, rows: 24 }) } }
  );

  const { data: popularSearchesData } = usePopularSearches({
    query: { enabled: q.length === 0 }
  });

  const { data: statsData } = useSearchStats({
    query: { enabled: q.length === 0 }
  });

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setLocation(`/?q=${encodeURIComponent(searchInput.trim())}&page=1`);
    } else {
      setLocation(`/`);
    }
  };

  const handlePopularSearchClick = (query: string) => {
    setSearchInput(query);
    setLocation(`/?q=${encodeURIComponent(query)}&page=1`);
  };

  const totalPages = searchResults ? Math.ceil(searchResults.total / 24) : 0;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header Pattern / Decorative Top */}
      <div className="h-1 bg-primary w-full opacity-80" />
      
      <main className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4 leading-tight">
            موسوعة كنوز العلم
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-serif">
            المكتبة الإلكترونية الشاملة للكتب والرسائل والمخطوطات الإسلامية
          </p>
          
          <form onSubmit={handleSearch} className="relative mt-8 group flex items-center shadow-sm hover:shadow-md transition-shadow duration-300 rounded-lg overflow-hidden border border-border/50 bg-card">
            <Search className="absolute right-4 text-muted-foreground w-5 h-5 pointer-events-none" />
            <Input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث عن كتاب، مؤلف، أو موضوع..."
              className="w-full pl-4 pr-12 py-6 text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent rounded-none h-14"
            />
            <Button type="submit" size="lg" className="rounded-none h-14 px-8 font-bold text-lg bg-primary hover:bg-primary/90 text-primary-foreground border-0">
              بحث
            </Button>
          </form>
        </div>

        {/* Content Area */}
        {q.length === 0 ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Empty State / Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <Card className="bg-card/50 border-border/50 shadow-sm">
                <CardHeader className="pb-2">
                  <Activity className="w-8 h-8 text-primary mb-2 opacity-80" />
                  <h3 className="font-serif font-bold text-lg">نشاط الموسوعة</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{statsData?.totalSearches.toLocaleString('ar-EG') || "..."}</p>
                  <p className="text-sm text-muted-foreground mt-1">عملية بحث كليّة</p>
                </CardContent>
              </Card>
              
              <Card className="bg-card/50 border-border/50 shadow-sm">
                <CardHeader className="pb-2">
                  <Book className="w-8 h-8 text-primary mb-2 opacity-80" />
                  <h3 className="font-serif font-bold text-lg">الكتب المُكتشَفة</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{statsData?.uniqueQueries.toLocaleString('ar-EG') || "..."}</p>
                  <p className="text-sm text-muted-foreground mt-1">موضوع ومؤلف فريد</p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50 shadow-sm">
                <CardHeader className="pb-2">
                  <History className="w-8 h-8 text-primary mb-2 opacity-80" />
                  <h3 className="font-serif font-bold text-lg">آخر ٢٤ ساعة</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{statsData?.last24h.toLocaleString('ar-EG') || "..."}</p>
                  <p className="text-sm text-muted-foreground mt-1">عملية بحث حديثة</p>
                </CardContent>
              </Card>
            </div>

            <div className="max-w-2xl mx-auto text-center">
              <h3 className="text-lg font-bold mb-6 text-foreground flex items-center justify-center gap-2">
                <Search className="w-5 h-5 text-muted-foreground" />
                عمليات البحث الشائعة
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {popularSearchesData?.map((item) => (
                  <button
                    key={item.query}
                    onClick={() => handlePopularSearchClick(item.query)}
                    className="px-4 py-2 bg-secondary/50 hover:bg-secondary text-secondary-foreground rounded-full text-sm font-medium transition-colors border border-border/50"
                  >
                    {item.query}
                  </button>
                ))}
                {!popularSearchesData && (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-24 rounded-full" />
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Search Results */}
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h2 className="text-2xl font-serif font-bold">
                نتائج البحث عن: <span className="text-primary">"{q}"</span>
              </h2>
              {searchResults && (
                <span className="text-muted-foreground bg-muted px-3 py-1 rounded-full text-sm">
                  {searchResults.total.toLocaleString('ar-EG')} نتيجة
                </span>
              )}
            </div>

            {isSearchError && (
              <div className="text-center py-16 bg-destructive/10 rounded-lg border border-destructive/20 text-destructive">
                <p className="text-lg font-medium">عذراً، حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.</p>
                <Button variant="outline" className="mt-4 border-destructive text-destructive hover:bg-destructive hover:text-white" onClick={() => window.location.reload()}>
                  إعادة المحاولة
                </Button>
              </div>
            )}

            {isSearchLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden flex flex-col">
                    <Skeleton className="h-48 w-full rounded-none" />
                    <CardHeader className="p-4 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardFooter className="p-4 mt-auto pt-0 gap-2">
                      <Skeleton className="h-9 w-full" />
                      <Skeleton className="h-9 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : searchResults?.books.length === 0 ? (
              <div className="text-center py-24 bg-card rounded-lg border border-border/50 shadow-sm">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">لم نعثر على نتائج مطابقة لبحثك.</h3>
                <p className="text-muted-foreground">جرّب استخدام كلمات أخرى أو صيغة مختلفة للبحث.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {searchResults?.books.map((book) => (
                    <Card key={book.identifier} className="overflow-hidden flex flex-col group hover:shadow-lg transition-shadow duration-300 border-border/60 bg-card">
                      <div className="relative h-56 bg-muted overflow-hidden flex items-center justify-center p-4">
                        {book.thumbnail ? (
                          <img 
                            src={book.thumbnail} 
                            alt={book.title} 
                            loading="lazy"
                            className="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              e.currentTarget.parentElement?.classList.add('fallback-bg');
                            }}
                          />
                        ) : (
                          <Book className="w-16 h-16 text-muted-foreground/30" />
                        )}
                        <style>{`
                          .fallback-bg::before {
                            content: "";
                            position: absolute;
                            inset: 0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book text-muted-foreground opacity-30"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>');
                            background-repeat: no-repeat;
                            background-position: center;
                          }
                        `}</style>
                      </div>
                      <CardHeader className="p-4 flex-grow">
                        <h3 className="font-serif font-bold text-lg line-clamp-2 leading-snug group-hover:text-primary transition-colors" title={book.title}>
                          {book.title}
                        </h3>
                        {book.creator && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-1 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/40 inline-block"></span>
                            {book.creator}
                          </p>
                        )}
                        {book.year && (
                          <p className="text-xs text-muted-foreground/70 mt-1">{book.year}</p>
                        )}
                      </CardHeader>
                      <CardFooter className="p-4 pt-0 gap-2 flex-col xs:flex-row">
                        <Button asChild variant="default" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm">
                          <a href={book.readUrl} target="_blank" rel="noopener noreferrer">
                            <BookOpen className="w-4 h-4 ml-2" />
                            قراءة أونلاين
                          </a>
                        </Button>
                        <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5 font-medium" onClick={() => window.open(book.downloadUrl, '_blank')}>
                          <Download className="w-4 h-4 ml-2" />
                          تحميل مباشر
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12 pt-6 border-t border-border/50">
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation(`/?q=${encodeURIComponent(q)}&page=${page - 1}`)}
                      disabled={page <= 1}
                      className="flex items-center gap-2 border-border/80"
                    >
                      <ChevronRight className="w-4 h-4" />
                      السابق
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground mx-4">
                      صفحة {page} من {totalPages.toLocaleString('ar-EG')}
                    </span>
                    <Button 
                      variant="outline" 
                      onClick={() => setLocation(`/?q=${encodeURIComponent(q)}&page=${page + 1}`)}
                      disabled={page >= totalPages}
                      className="flex items-center gap-2 border-border/80"
                    >
                      التالي
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/30 py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm font-serif">
            موسوعة كنوز العلم الإلكترونية. واجهة برمجية تعتمد على أرشيف الإنترنت.
          </p>
        </div>
      </footer>
    </div>
  );
}
