import React from 'react';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({ 
  currentPage, 
  lastPage, 
  onPageChange,
  disabled = false
}) => {
  // No pagination needed for single page
  if (lastPage <= 1) {
    return null;
  }

  // Create array of page numbers to show
  const getPageNumbers = (): number[] => {
    const pages: number[] = [];
    
    // On mobile, show fewer pages
    const isMobile = window.innerWidth < 640;
    const pagePadding = isMobile ? 0 : 1;
    
    // Always show first page
    pages.push(1);
    
    // Current page neighborhood
    for (let i = Math.max(2, currentPage - pagePadding); i <= Math.min(lastPage - 1, currentPage + pagePadding); i++) {
      pages.push(i);
    }
    
    // End at last page
    if (lastPage > 1) {
      pages.push(lastPage);
    }
    
    // Deduplicate
    return [...new Set(pages)];
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 text-white" aria-label="صفحات">
      {/* First page button on larger screens */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1 || disabled}
        className={`hidden sm:flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all ${
          currentPage === 1 || disabled
            ? 'bg-white/5 text-white/40 cursor-not-allowed'
            : 'bg-white/10 hover:bg-white/20'
        }`}
        aria-label="الصفحة الأولى"
      >
        <span className="text-xs sm:text-sm">&#171;</span>
      </button>

      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || disabled}
        className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all ${
          currentPage === 1 || disabled
            ? 'bg-white/5 text-white/40 cursor-not-allowed'
            : 'bg-white/10 hover:bg-white/20'
        }`}
        aria-label="الصفحة السابقة"
      >
        <span className="text-xs sm:text-sm">&#8249;</span>
        <span className="hidden sm:inline mr-1">السابق</span>
      </button>
      
      {/* Page numbers */}
      <div className="flex items-center">
        {pageNumbers.map((pageNumber, index) => {
          // Add ellipsis
          const showEllipsisBefore =
            index > 0 && pageNumber - pageNumbers[index - 1] > 1;
          
          return (
            <React.Fragment key={pageNumber}>
              {showEllipsisBefore && (
                <span className="px-2 sm:px-3 py-1.5 sm:py-2 text-white/40 text-sm sm:text-base">...</span>
              )}
              <button
                onClick={() => onPageChange(pageNumber)}
                disabled={pageNumber === currentPage || disabled}
                className={`min-w-[36px] px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all text-sm sm:text-base ${
                  pageNumber === currentPage
                    ? 'bg-white/30 text-white font-medium'
                    : 'bg-white/10 hover:bg-white/20'
                }`}
                aria-current={pageNumber === currentPage ? 'page' : undefined}
                aria-label={`الصفحة ${pageNumber}`}
              >
                {pageNumber}
              </button>
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === lastPage || disabled}
        className={`flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all ${
          currentPage === lastPage || disabled
            ? 'bg-white/5 text-white/40 cursor-not-allowed'
            : 'bg-white/10 hover:bg-white/20'
        }`}
        aria-label="الصفحة التالية"
      >
        <span className="hidden sm:inline ml-1">التالي</span>
        <span className="text-xs sm:text-sm">&#8250;</span>
      </button>

      {/* Last page button on larger screens */}
      <button
        onClick={() => onPageChange(lastPage)}
        disabled={currentPage === lastPage || disabled}
        className={`hidden sm:flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all ${
          currentPage === lastPage || disabled
            ? 'bg-white/5 text-white/40 cursor-not-allowed'
            : 'bg-white/10 hover:bg-white/20'
        }`}
        aria-label="الصفحة الأخيرة"
      >
        <span className="text-xs sm:text-sm">&#187;</span>
      </button>

      {/* Current page indicator for mobile */}
      <div className="w-full text-center text-xs text-white/60 mt-2 sm:hidden">
        صفحة {currentPage} من {lastPage}
      </div>
    </nav>
  );
};

export default Pagination; 