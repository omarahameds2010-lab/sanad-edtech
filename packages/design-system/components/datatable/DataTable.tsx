import { forwardRef, useState, useMemo } from 'react';
import { ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon, ChevronRightIcon, CheckIcon } from '../icon/icons';

export interface Column<T> {
  key: string;
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  width?: string;
  minWidth?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: string;
  selectionMode?: 'none' | 'single' | 'multiple';
  onSelectionChange?: (selectedKeys: Set<string>) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (key: string, order: 'asc' | 'desc') => void;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  loading?: boolean;
  emptyMessage?: string;
}

function DataTableComponent<T>({
  data,
  columns,
  rowKey,
  selectionMode = 'none',
  onSelectionChange,
  sortBy: sortByProp,
  sortOrder: sortOrderProp,
  onSortChange,
  pagination,
  loading = false,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const [sortBy, setSortBy] = useState<string | null>(sortByProp || null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(pagination?.page || 1);
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);

  const sortedData = useMemo(() => {
    if (!sortBy) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortBy as keyof T];
      const bVal = b[sortBy as keyof T];
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortBy, sortOrder]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
    onSortChange?.(key, sortBy === key ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc');
  };

  const paginatedData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  return (
    <div style={{ border: '1px solid var(--color-border-main)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--color-bg-primary)' }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--color-neutral-50)' }}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    padding: '12px 16px',
                    textAlign: column.align || 'left',
                    fontWeight: 600,
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    borderBottom: '1px solid var(--color-border-main)',
                    whiteSpace: 'nowrap',
                    width: column.width,
                    minWidth: column.minWidth,
                    cursor: column.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: column.align === 'right' ? 'flex-end' : column.align === 'center' ? 'center' : 'flex-start' }}>
                    {column.header}
                    {column.sortable && (
                      <span style={{ marginLeft: '8px', display: 'inline-flex' }}>
                        {sortBy === column.key ? (
                          sortOrder === 'asc' ? '▲' : '▼'
                        ) : (
                          '↕'
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr key={row[rowKey]} style={{ borderBottom: '1px solid var(--color-border-main)', cursor: 'pointer', transition: 'background-color 0.1s ease' }} onClick={() => onSelectionChange?.(new Set([String(row[rowKey])]))} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-neutral-50)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  {columns.map((column) => (
                    <td key={column.key} style={{ padding: '12px 16px', textAlign: column.align || 'left', borderBottom: '1px solid var(--color-border-light)', verticalAlign: 'middle', width: column.width, minWidth: column.minWidth }}>
                      {column.render ? column.render(row[column.accessor as keyof typeof row], row) : String(row[column.accessor as keyof typeof row] ?? '')}
                    </td>
                  ))}
                </tr>
              )))}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border-main)' }}>
          <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, pagination.total)} of {pagination.total} results
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); pagination.onPageSizeChange?.(Number(e.target.value)); }}
              style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-main)', fontSize: '13px' }}
            >
              {[10, 25, 50, 100].map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
            <button
              onClick={() => { if (currentPage > 1) { setCurrentPage(currentPage - 1); pagination.onPageChange(currentPage - 1); }}}
              disabled={currentPage <= 1}
              style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-main)', background: 'var(--color-bg-primary)', cursor: currentPage <= 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeftIcon size={16} />
            </button>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', minWidth: '60px', textAlign: 'center' }}>
              Page {currentPage} of {Math.ceil(pagination.total / pageSize)}
            </span>
            <button
              onClick={() => { if (currentPage < Math.ceil(pagination.total / pageSize)) { setCurrentPage(currentPage + 1); pagination.onPageChange(currentPage + 1); }}}
              disabled={currentPage >= Math.ceil(pagination.total / pageSize)}
              style={{ padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-main)', background: 'var(--color-bg-primary)', cursor: currentPage >= Math.ceil(pagination.total / pageSize) ? 'not-allowed' : 'pointer' }}
            >
              <ChevronRightIcon size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const DataTable = forwardRef(DataTableComponent);

DataTable.displayName = 'DataTable';

export { DataTable };
export type { Column, DataTableProps };