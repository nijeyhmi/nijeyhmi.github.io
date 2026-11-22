const btn = "h-[36px] min-w-[36px] px-[6px] rounded-full text-lime-950";

const Pagination = ({ startPage, endPage, totalPages, navigatePage, page }) => {
  if (totalPages <= 1) return null;
  return (
    <nav className="pt-[24px]" aria-label="페이지 이동">
      <ul className="flex flex-wrap gap-[6px] m-0 p-0">
        {startPage > 1 && (
          <li>
            <button
              type="button"
              className={btn}
              aria-label="이전 페이지 묶음"
              onClick={() => navigatePage(startPage - 1)}
            >
              {"<"}
            </button>
          </li>
        )}
        {Array.from({ length: endPage - startPage + 1 }, (_, idx) => {
          const pageNum = startPage + idx;
          const isCurrent = pageNum === page;
          return (
            <li key={pageNum}>
              <button
                type="button"
                className={`${btn} ${isCurrent ? "bg-green-50 font-bold" : ""}`}
                aria-current={isCurrent ? "page" : undefined}
                onClick={() => navigatePage(pageNum)}
              >
                {pageNum}
              </button>
            </li>
          );
        })}
        {endPage < totalPages && (
          <li>
            <button
              type="button"
              className={btn}
              aria-label="다음 페이지 묶음"
              onClick={() => navigatePage(endPage + 1)}
            >
              {">"}
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Pagination;
