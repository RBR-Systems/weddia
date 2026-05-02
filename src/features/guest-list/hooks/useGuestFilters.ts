import { useMemo, useState } from "react";
import { Guest, GuestFilters } from "../models/guestList.models";
import { applyGuestFilters } from "../utils/guestList.utils";

export function useGuestFilters(guests: Guest[]) {
  const [filters, setFilters] = useState<GuestFilters>({ status: "all" });

  const filteredGuests = useMemo(() => applyGuestFilters(guests, filters), [guests, filters]);

  const hasActiveFilters =
    !!filters.query ||
    (!!filters.relation_id && (!Array.isArray(filters.relation_id) || filters.relation_id.length > 0)) ||
    (!!filters.status && filters.status !== "all" && (!Array.isArray(filters.status) || filters.status.length > 0)) ||
    (!!filters.specials && filters.specials.length > 0);

  const relationIds: string[] = filters.relation_id
    ? Array.isArray(filters.relation_id) ? filters.relation_id : [filters.relation_id]
    : [];

  const activeStatusList: string[] =
    filters.status && filters.status !== "all"
      ? Array.isArray(filters.status) ? filters.status : [filters.status]
      : [];

  const handleRemoveQueryFilter = () => setFilters((prev) => ({ ...prev, query: undefined }));

  const handleRemoveRelationFilter = (rid: string) =>
    setFilters((prev) => {
      const cur = prev.relation_id;
      if (Array.isArray(cur)) {
        const next = cur.filter((x) => x !== rid);
        return { ...prev, relation_id: next.length ? next : null };
      }
      return { ...prev, relation_id: null };
    });

  const handleRemoveStatusFilter = (s: string) =>
    setFilters((prev) => {
      const cur = prev.status;
      if (Array.isArray(cur)) {
        const next = cur.filter((x) => x !== s);
        return { ...prev, status: next.length ? next : "all" };
      }
      return { ...prev, status: "all" };
    });

  const handleRemoveSpecialFilter = (sp: string) =>
    setFilters((prev) => {
      const next = (prev.specials || []).filter((x) => x !== sp);
      return { ...prev, specials: next.length ? next : undefined };
    });

  const handleClearAllFilters = () =>
    setFilters({ status: "all", relation_id: undefined, query: undefined, specials: undefined });

  const handleStatusClick = (s: string) =>
    setFilters((prev) => {
      const cur = prev.status;
      if (cur === "all" || cur === undefined) return { ...prev, status: [s] };
      if (Array.isArray(cur)) {
        const has = cur.includes(s);
        const next = has ? cur.filter((x) => x !== s) : [...cur, s];
        return { ...prev, status: next.length ? next : "all" };
      }
      if (cur === s) return { ...prev, status: "all" };
      return { ...prev, status: [cur, s] };
    });

  return {
    filters,
    setFilters,
    filteredGuests,
    hasActiveFilters,
    relationIds,
    activeStatusList,
    handleRemoveQueryFilter,
    handleRemoveRelationFilter,
    handleRemoveStatusFilter,
    handleRemoveSpecialFilter,
    handleClearAllFilters,
    handleStatusClick,
  };
}
