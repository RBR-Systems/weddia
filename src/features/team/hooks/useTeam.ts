"use client";
import { useCallback, useEffect, useState } from "react";
import type { TeamMember, MemberEvent, TeamMemberFormValues, MemberEventFormValues } from "../models/team.models";
import {
  fetchMembers,
  createMember,
  updateMember,
  deleteMember,
  fetchMemberEvents,
  createMemberEvent,
  deleteMemberEvent,
} from "../api/teamApi";

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [memberEvents, setMemberEvents] = useState<MemberEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [membersData, eventsData] = await Promise.all([
        fetchMembers(),
        fetchMemberEvents(),
      ]);
      setMembers(membersData);
      setMemberEvents(eventsData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addMember = useCallback(async (values: TeamMemberFormValues): Promise<void> => {
    const created = await createMember(values);
    setMembers((prev) => [...prev, created]);
  }, []);

  const editMember = useCallback(async (id: number, values: Partial<TeamMemberFormValues>): Promise<void> => {
    await updateMember(id, values);
    setMembers((prev) => prev.map((m) => (m.member_id === id ? { ...m, ...values } : m)));
  }, []);

  const removeMember = useCallback(async (id: number): Promise<void> => {
    await deleteMember(id);
    setMembers((prev) => prev.filter((m) => m.member_id !== id));
  }, []);

  const assignToEvent = useCallback(async (values: MemberEventFormValues): Promise<void> => {
    const created = await createMemberEvent(values);
    setMemberEvents((prev) => [...prev, created]);
  }, []);

  const removeFromEvent = useCallback(async (memberId: number, eventId: number): Promise<void> => {
    await deleteMemberEvent(memberId, eventId);
    setMemberEvents((prev) =>
      prev.filter((me) => !(me.member_id === memberId && me.event_id === eventId))
    );
  }, []);

  return {
    members,
    memberEvents,
    loading,
    reload: load,
    addMember,
    editMember,
    removeMember,
    assignToEvent,
    removeFromEvent,
  };
}
