import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { F1Api, toArray } from "../../api/client";
import WikiLink from "../../components/common/WikiLink";
import Modal from "../../components/common/Modal";
import Pagination from "../../components/common/Pagination";
import DriverBadge from "../../components/common/DriverBadge";
import TeamBadge from "../../components/common/TeamBadge";
import {
  CardGridSkeleton,
  TablePanelSkeleton,
} from "../../components/common/Skeleton";
import { CountryFlag } from "../../utils/flags";
import { getCircuitTrackMap, getHeroImage } from "../../utils/f1Assets";

function FeaturedCircuitCard({ circuit, onSelect }) {
  const [svgFailed, setSvgFailed] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);

  const svgUrl = getCircuitTrackMap(
    circuit.circuit_name,
    circuit.location,
    circuit.country,
    circuit.circuitId
  );
  const heroUrl = getHeroImage(
    circuit.circuit_name,
    circuit.location,
    circuit.country,
    circuit.circuitId
  );

  return (
    <div
      className="f1-circuit-visual-card"
      onClick={onSelect}
      style={{
        backgroundImage:
          heroUrl && !heroFailed
            ? `linear-gradient(180deg, rgba(10,11,16,0.72) 0%, rgba(10,11,16,0.94) 100%), url("${heroUrl}")`
            : "linear-gradient(135deg, #13151f 0%, #0b0c12 100%)",
      }}
    >
      {heroUrl && (
        <img
          src={heroUrl}
          alt=""
          style={{ display: "none" }}
          onError={() => setHeroFailed(true)}
        />
      )}

      <div className="circuit-card-top">
        <div className="circuit-country-tag">
          <CountryFlag name={circuit.country} size={18} />
          <span>{circuit.country || "-"}</span>
        </div>
        {circuit.altitude_meters !== undefined &&
          circuit.altitude_meters !== null && (
            <span className="f1-minimal-pill">
              ALT {circuit.altitude_meters}M
            </span>
          )}
      </div>

      <div className="circuit-card-svg-stage">
        {svgUrl && !svgFailed ? (
          <img
            src={svgUrl}
            alt={circuit.circuit_name}
            className="circuit-card-svg"
            loading="lazy"
            onError={() => setSvgFailed(true)}
          />
        ) : (
          <div className="circuit-card-svg-fallback">
            <span>{circuit.location || circuit.country || "CIRCUIT"}</span>
          </div>
        )}
      </div>

      <div className="circuit-card-bottom">
        <div>
          <h4 className="circuit-card-title">{circuit.circuit_name}</h4>
          <span className="circuit-card-loc">
            {[circuit.location, circuit.country].filter(Boolean).join(", ")}
          </span>
        </div>
        <span className="circuit-card-cta">
          Past Winners <i className="fa-solid fa-arrow-right"></i>
        </span>
      </div>
    </div>
  );
}

export default function CircuitsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const [selectedCircuit, setSelectedCircuit] = useState(null);

  const { data: circuits = [], isLoading } = useQuery({
    queryKey: ["circuits"],
    queryFn: async () => {
      const res = await F1Api.getCircuits();
      return toArray(res);
    },
  });

  const { data: winnersHistory = [], isLoading: loadingHistory } = useQuery({
    queryKey: ["circuitHistory", selectedCircuit?.id],
    queryFn: async () => {
      if (!selectedCircuit?.id) return [];
      const res = await F1Api.getCircuitHistory(selectedCircuit.id);
      return toArray(res);
    },
    enabled: !!selectedCircuit?.id,
  });

  const safeCircuits = Array.isArray(circuits) ? circuits : [];
  const safeWinnersHistory = Array.isArray(winnersHistory)
    ? winnersHistory
    : [];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return safeCircuits.filter(
      (c) =>
        (c?.circuit_name && c.circuit_name.toLowerCase().includes(q)) ||
        (c?.country && c.country.toLowerCase().includes(q)) ||
        (c?.location && c.location.toLowerCase().includes(q))
    );
  }, [safeCircuits, search]);

  const sortedCircuits = useMemo(() => {
    return [...filtered].sort((a, b) =>
      String(a?.circuit_name || "").localeCompare(String(b?.circuit_name || ""))
    );
  }, [filtered]);

  const totalPages = Math.ceil(sortedCircuits.length / itemsPerPage) || 1;
  const safePage = Math.min(Math.max(1, page), totalPages);
  const paginated = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return sortedCircuits.slice(start, start + itemsPerPage);
  }, [sortedCircuits, safePage]);

  const openCircuitWinners = (c) => {
    setSelectedCircuit({
      id: c.circuitId || c.circuit_id || c.id,
      name: c.circuit_name,
      country: c.country,
      location: c.location,
    });
  };

  return (
    <section id="view-circuits-db" className="content-view active">
      <div className="f1-page-header">
        <div>
          <span className="page-overline">WORLD GRAND PRIX VENUES & WINNERS</span>
          <h2 className="page-main-title">
            Circuits Directory & Historical Winners
          </h2>
        </div>

        <div className="header-action-group">
          <input
            type="text"
            id="circuit-search-input"
            className="f1-minimal-search"
            placeholder="Search circuit name, city, or country..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* CIRCUITS VISUAL CARD GRID + PAGINATION */}
      {isLoading ? (
        <CardGridSkeleton
          count={9}
          gridClass="f1-circuits-featured-grid mb-4"
          cardHeight={240}
        />
      ) : paginated.length > 0 ? (
        <>
          <div className="f1-circuits-featured-grid mb-4">
            {paginated.map((c) => (
              <FeaturedCircuitCard
                key={c.circuitId || c.circuit_name}
                circuit={c}
                onSelect={() => openCircuitWinners(c)}
              />
            ))}
          </div>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            totalItems={filtered.length}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </>
      ) : (
        <div className="f1-empty-state">No circuits found.</div>
      )}

      {/* PAST GRAND PRIX WINNERS MODAL (Reference 1 Table Style) */}
      <Modal
        isOpen={!!selectedCircuit}
        onClose={() => setSelectedCircuit(null)}
        title={`Past Grand Prix Winners — ${selectedCircuit?.name || "Circuit"}`}
      >
        {loadingHistory ? (
          <TablePanelSkeleton rows={6} cols={5} />
        ) : safeWinnersHistory.length > 0 ? (
          <div className="table-responsive" style={{ maxHeight: "480px" }}>
            <table className="f1-minimal-table">
              <thead>
                <tr>
                  <th>SEASON</th>
                  <th>GRAND PRIX</th>
                  <th>WINNER</th>
                  <th>TEAM</th>
                  <th className="text-right">TIME</th>
                </tr>
              </thead>
              <tbody>
                {safeWinnersHistory.map((h, i) => {
                  const winnerName =
                    h.winner_name || h.driver_name || h.winner || "-";
                  const teamName =
                    h.winning_team || h.constructor_name || h.team || "-";
                  return (
                    <tr key={i}>
                      <td className="cell-round">{h.year}</td>
                      <td>
                        <WikiLink
                          text={h.grand_prix_name || h.race_name}
                          url={h.race_wiki_url}
                        />
                      </td>
                      <td>
                        <DriverBadge
                          name={winnerName}
                          team={teamName}
                          season={h.year}
                          wikiUrl={h.driver_wiki_url}
                        />
                      </td>
                      <td>
                        <TeamBadge
                          name={teamName}
                          season={h.year}
                          wikiUrl={h.constructor_wiki_url}
                        />
                      </td>
                      <td className="cell-tabular text-right">
                        {h.winning_time || h.time || h.race_time || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="f1-empty-state">
            No recorded Grand Prix winner history for this circuit.
          </div>
        )}
      </Modal>
    </section>
  );
}
