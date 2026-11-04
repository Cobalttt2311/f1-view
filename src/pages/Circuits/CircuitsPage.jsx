import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { F1Api } from '../../api/client';
import WikiLink from '../../components/common/WikiLink';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import { CountryFlag } from '../../utils/flags';
import { useTableSort } from '../../utils/useTableSort';

export default function CircuitsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  // Selected circuit for winners history modal
  const [selectedCircuit, setSelectedCircuit] = useState(null); // { id, name }

  const { data: circuits = [], isLoading } = useQuery({
    queryKey: ['circuits'],
    queryFn: async () => {
      const res = await F1Api.getCircuits();
      return res?.data || res || [];
    },
  });

  // Query circuit history
  const { data: winnersHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ['circuitHistory', selectedCircuit?.id],
    queryFn: async () => {
      if (!selectedCircuit?.id) return [];
      const res = await F1Api.getCircuitHistory(selectedCircuit.id);
      return res?.data || res || [];
    },
    enabled: !!selectedCircuit?.id,
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return circuits.filter(
      (c) =>
        (c.circuit_name && c.circuit_name.toLowerCase().includes(q)) ||
        (c.country && c.country.toLowerCase().includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q)) ||
        (c.circuitId && String(c.circuitId).toLowerCase().includes(q))
    );
  }, [circuits, search]);

  const { sortedData: sortedCircuits, sortKey, sortDir, requestSort } = useTableSort(filtered, 'circuitId');

  const totalPages = Math.ceil(sortedCircuits.length / itemsPerPage) || 1;
  const paginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return sortedCircuits.slice(start, start + itemsPerPage);
  }, [sortedCircuits, page]);

  return (
    <section id="view-circuits-db" className="content-view active">
      <div className="view-header">
        <div>
          <h2>Circuits Directory & Historical Winners</h2>
          <p className="text-muted">
            Explore world circuits, track locations, altitudes, and all past Grand Prix winners at each venue.
          </p>
        </div>
        <div className="header-action-group">
          <input
            type="text"
            id="circuit-search-input"
            className="f1-search"
            placeholder="Search circuit or country..."
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
            <table className="f1-table" id="circuits-directory-table">
              <thead>
                <tr>
                  <th
                    className={sortKey === 'circuitId' ? `sort-${sortDir}` : 'sortable'}
                    onClick={() => requestSort('circuitId')}
                  >
                    ID <span className="sort-icon"></span>
                  </th>
                  <th
                    className={sortKey === 'circuit_name' ? `sort-${sortDir}` : 'sortable'}
                    onClick={() => requestSort('circuit_name')}
                  >
                    Circuit Name <span className="sort-icon"></span>
                  </th>
                  <th
                    className={sortKey === 'location' ? `sort-${sortDir}` : 'sortable'}
                    onClick={() => requestSort('location')}
                  >
                    Location <span className="sort-icon"></span>
                  </th>
                  <th
                    className={sortKey === 'country' ? `sort-${sortDir}` : 'sortable'}
                    onClick={() => requestSort('country')}
                  >
                    Country <span className="sort-icon"></span>
                  </th>
                  <th
                    className={sortKey === 'altitude_meters' ? `sort-${sortDir}` : 'sortable'}
                    onClick={() => requestSort('altitude_meters')}
                  >
                    Altitude <span className="sort-icon"></span>
                  </th>
                  <th>History & Winners</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      <i className="fa-solid fa-spinner fa-spin"></i> Loading circuits...
                    </td>
                  </tr>
                ) : paginated.length > 0 ? (
                  paginated.map((c) => (
                    <tr key={c.circuitId || c.circuit_name}>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{c.circuitId}</td>
                      <td>
                        <WikiLink text={c.circuit_name} url={c.circuit_wiki_url} />
                      </td>
                      <td>{c.location || '-'}</td>
                      <td>
                        <CountryFlag name={c.country} />
                        <span>{c.country || '-'}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {c.altitude_meters ? `${c.altitude_meters}m` : '-'}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() =>
                            setSelectedCircuit({
                              id: c.circuitId || c.circuit_id || c.id,
                              name: c.circuit_name,
                            })
                          }
                        >
                          <i className="fa-solid fa-trophy"></i> Past Winners
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      No circuits found.
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

      {/* Past Winners Modal */}
      <Modal
        isOpen={!!selectedCircuit}
        onClose={() => setSelectedCircuit(null)}
        title={`Past Grand Prix Winners — ${selectedCircuit?.name || 'Circuit'}`}
      >
        {loadingHistory ? (
          <div className="text-center py-4 text-muted">
            <i className="fa-solid fa-spinner fa-spin fa-2x"></i>
            <p className="mt-2">Loading past winners...</p>
          </div>
        ) : winnersHistory.length > 0 ? (
          <div className="table-responsive">
            <table className="f1-table">
              <thead>
                <tr>
                  <th>Season</th>
                  <th>Grand Prix</th>
                  <th>Winning Driver</th>
                  <th>Winning Team</th>
                  <th>Winning Time</th>
                </tr>
              </thead>
              <tbody>
                {winnersHistory.map((h, i) => (
                  <tr key={i}>
                    <td>
                      <span className="badge badge-f1">{h.year}</span>
                    </td>
                    <td>
                      <WikiLink text={h.grand_prix_name || h.race_name} url={h.race_wiki_url} />
                    </td>
                    <td>
                      <strong>
                        <WikiLink text={h.winner_name || h.driver_name || h.winner} url={h.driver_wiki_url} />
                      </strong>
                    </td>
                    <td>
                      <WikiLink text={h.winning_team || h.constructor_name || h.team} url={h.constructor_wiki_url} />
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{h.winning_time || h.time || h.race_time || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 text-muted">
            No recorded Grand Prix winner history for this circuit.
          </div>
        )}
      </Modal>
    </section>
  );
}
