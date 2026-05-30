import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ChevronDown as ExpandIcon, ChevronUp as CollapseIcon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  mobileHidden?: boolean;
  tabletHidden?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  pageSize?: number;
}

type SortDirection = "asc" | "desc";

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = "Ingen data tilgjengelig",
  pageSize = 10,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey]
  );

  const toggleExpanded = useCallback(
    (rowId: string) => {
      setExpandedRow((current) => (current === rowId ? null : rowId));
    },
    []
  );

  const sortedData = [...data];
  if (sortKey) {
    sortedData.sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDir === "asc" ? -1 : 1;
      if (bVal == null) return sortDir === "asc" ? 1 : -1;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

  // Columns visible on mobile
  const visibleColumns = columns.filter((c) => !c.mobileHidden);
  const mobileHiddenColumns = columns.filter((c) => c.mobileHidden);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-muted">
        <div className="w-20 h-20 mb-4 rounded-2xl bg-[#F5F1EB] border-2 border-[#DDD6CC] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-[#DDD6CC]">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto scrollbar-hide rounded-2xl border border-[#DDD6CC] bg-white shadow-card">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#EDE7DE]">
              {/* Expand toggle column on mobile */}
              {mobileHiddenColumns.length > 0 && (
                <th className="w-10 px-2 py-2.5 sm:px-3 sm:py-3 lg:hidden" />
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 sm:px-4 sm:py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-secondary whitespace-nowrap ${col.sortable ? "cursor-pointer select-none hover:text-text-primary" : ""} ${col.className ?? ""} ${col.mobileHidden ? "hidden sm:table-cell" : ""} ${col.tabletHidden ? "hidden lg:table-cell" : ""}`}
                  onClick={
                    col.sortable ? () => handleSort(col.key) : undefined
                  }
                >
                  <div className="flex items-center gap-1">
                    <span className="text-xs sm:text-[11px]">{col.header}</span>
                    {col.sortable && sortKey === col.key && (
                      <span className="inline-flex">
                        {sortDir === "asc" ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => {
              const rowId = keyExtractor(row);
              const isExpanded = expandedRow === rowId;

              return (
                <>
                  <tr
                    key={rowId}
                    className={`border-t border-[#DDD6CC] ${idx % 2 === 1 ? "bg-[#F5F1EB]" : "bg-white"} ${onRowClick ? "cursor-pointer hover:bg-[rgba(26,107,124,0.04)]" : ""} transition-colors duration-150`}
                    onClick={
                      onRowClick ? () => onRowClick(row) : undefined
                    }
                  >
                    {/* Expand toggle cell on mobile */}
                    {mobileHiddenColumns.length > 0 && (
                      <td className="px-2 py-3 sm:px-3 sm:py-3.5 lg:hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(rowId);
                          }}
                          className="p-1 rounded-md hover:bg-cream transition-colors touch-target flex items-center justify-center"
                          aria-label={isExpanded ? "Skjul detaljer" : "Vis mer"}
                        >
                          {isExpanded ? (
                            <CollapseIcon className="w-4 h-4 text-text-secondary" />
                          ) : (
                            <ExpandIcon className="w-4 h-4 text-text-secondary" />
                          )}
                        </button>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-3 py-3 sm:px-4 sm:py-3.5 text-xs sm:text-sm text-text-primary ${col.className ?? ""} ${col.mobileHidden ? "hidden sm:table-cell" : ""} ${col.tabletHidden ? "hidden lg:table-cell" : ""}`}
                      >
                        {col.render
                          ? col.render(row)
                          : String(
                              (row as Record<string, unknown>)[col.key] ?? "-"
                            )}
                      </td>
                    ))}
                  </tr>

                  {/* Expanded row: show hidden columns on mobile */}
                  <AnimatePresence>
                    {isExpanded && mobileHiddenColumns.length > 0 && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="lg:hidden border-t border-dashed border-[#DDD6CC] bg-[#FAF8F5]"
                      >
                        <td
                          colSpan={visibleColumns.length + 1}
                          className="px-3 py-3 sm:px-4 sm:py-4"
                        >
                          <div className="space-y-2">
                            {mobileHiddenColumns.map((col) => (
                              <div
                                key={col.key}
                                className="flex items-start justify-between gap-3"
                              >
                                <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted flex-shrink-0">
                                  {col.header}
                                </span>
                                <span className="text-xs text-text-primary text-right break-all">
                                  {col.render
                                    ? col.render(row)
                                    : String(
                                        (row as Record<string, unknown>)[
                                          col.key
                                        ] ?? "-"
                                      )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2 gap-3">
          <p className="text-xs text-text-muted flex-shrink-0">
            Viser {startIndex + 1}–
            {Math.min(startIndex + pageSize, sortedData.length)} av{" "}
            {sortedData.length}
          </p>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-text-secondary hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-target"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-medium transition-colors ${
                    page === currentPage
                      ? "bg-deep-teal text-white"
                      : "text-text-secondary hover:bg-cream"
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg text-text-secondary hover:bg-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors touch-target"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
