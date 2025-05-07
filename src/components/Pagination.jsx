const Pagination = ({ startPage, endPage, totalPages, navigatePage, page }) => {
  return (
    <nav className="pt-[24px]">
      <ul className="flex m-0 p-0">
        {startPage > 1 && (
          <li className="ml-[6px]">
            <button
              className="h-[36px] min-w-[36px] px-[6px] rounded-full text-lime-950"
              onClick={() => navigatePage(startPage - 1)}
            >
              {"<"}
            </button>
          </li>
        )}
        {Array.from({ length: endPage - startPage + 1 }, (_, idx) => {
          const pageNum = startPage + idx;
          return (
            <li className="ml-[6px]" key={pageNum}>
              <button
                className={`h-[36px] min-w-[36px] px-[6px] rounded-full text-lime-950 ${idx + 1 === page ? "bg-green-50 font-bold" : ""}`}
                onClick={() => navigatePage(pageNum)}
              >
                {pageNum}
              </button>
            </li>
          );
        })}
        {endPage < totalPages && (
          <li className="ml-[6px]">
            <button
              className="h-[36px] min-w-[36px] px-[6px] rounded-full text-lime-950"
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
