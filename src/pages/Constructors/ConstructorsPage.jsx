import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { F1Api } from '../../api/client';
import WikiLink from '../../components/common/WikiLink';
import Pagination from '../../components/common/Pagination';
import { CountryFlag } from '../../utils/flags';
import { getTeamColor } from '../../utils/teamColors';
import { useTableSort } from '../../utils/useTableSort';

export default function ConstructorsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const { data: constructors = [], isLoading } = useQuery({
    queryKey: ['constructors'],
    queryFn: async () => {
      const res = await F1Api.getConstructors();
      return res?.data || res || [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return constructors.filter(
      (c) =>
        (c.constructor_name && c.constructor_name.toLowerCase().includes(q)) ||
        (c.constructor_nationality && c.constructor_nationality.toLowerCase().includes(q)) ||
        (c.constructorRef && c.constructorRef.toLowerCase().includes(q))
    );
  }, [constructors, search]);

  const { sortedData, sortKey, sortDir, requestSort } = useTableSort(filtered, 'constructor_name');

  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, page]);

  return (
    <section id="view-constructors-db" className="content-view active">
      <div className="view-header">
        <div>
          <h2>Constructors / Teams Directory</h2>
          <p className="text-muted">
            Complete archive of all Formula 1 constructors and racing teams.
          </p>
        </div>
        <div className="header-action-group">
          <input
            type="text"
            id="constructor-search-input"
            className="f1-search"
            placeholder="Search constructor team..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="f1-card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="f1-table" id="constructors-directory-table">
              <thead>
                <tr>
                  <th
                    className={sortKey === 'constructorId' ? `sort-${sortDir}` : 'sortable'}
                    onClick={() => requestSort('constructorId')}
                  >
                    ID <span className="sort-icon"></span>
                  </th>
                  <th
                    className={sortKey === 'constructor_name' ? `sort-${sortDir}` : 'sortable'}
                    onClick={() => requestSort('constructor_name')}
                  >
                    Constructor Name <span className="sort-icon"></span>
                  </th>
                  <th
                    className={sortKey === 'constructor_nationality' ? `sort-${sortDir}` : 'sortable'}
                    onClick={() => requestSort('constructor_nationality')}
                  >
                    Nationality <span className="sort-icon"></span>
                  </th>
                  <th
                    className={sortKey === 'constructorRef' ? `sort-${sortDir}` : 'sortable'}
                    onClick={() => requestSort('constructorRef')}
                  >
                    Reference <span className="sort-icon"></span>
                  </th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      <i className="fa-solid fa-spinner fa-spin"></i> Loading constructors...
                    </td>
                  </tr>
                ) : paginated.length > 0 ? (
                  paginated.map((c) => {
                    const teamColor = getTeamColor(c.constructor_name || c.constructorRef || '');
                    return (
                      <tr key={c.constructorId || c.constructor_name}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{c.constructorId}</td>
                        <td>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                width: '4px',
                                height: '20px',
                                borderRadius: '2px',
                                background: teamColor,
                                flexShrink: 0,
                              }}
                            />
                            <WikiLink text={c.constructor_name} url={c.constructor_wiki_url} />
                          </span>
                        </td>
                        <td>
                          <CountryFlag name={c.constructor_nationality} />
                          <span>{c.constructor_nationality || '-'}</span>
                        </td>
                        <td className="text-muted" style={{ fontFamily: 'var(--font-mono)' }}>
                          {c.constructorRef || '-'}
                        </td>
                        <td>
                          {c.constructor_wiki_url ? (
                            <a
                              href={c.constructor_wiki_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline"
                            >
                              <i className="fa-brands fa-wikipedia-w"></i> Wikipedia
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      No constructors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>
    </section>
  );
}
