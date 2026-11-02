import React, { useState } from "react";
import {
  Clock,
  Download,
  Filter,
  Search,
  Shield,
  ShieldAlert,
  User,
} from "lucide-react";
import { getStoredAuditLogs } from "../../services/mockDataStore";
import { AuditLogItem } from "../../types";

export const AuditLogs: React.FC = () => {
  const [logs] = useState<AuditLogItem[]>(getStoredAuditLogs);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");

  const filtered = logs.filter((item) => {
    const textMatch = `${item.actorName} ${item.action} ${item.details} ${item.entityType}`
      .toLowerCase()
      .includes(search.toLowerCase());
    const actionMatch =
      actionFilter === "ALL" || item.action.includes(actionFilter);
    return textMatch && actionMatch;
  });

  const exportCSV = () => {
    const headers = "ID,Timestamp,Actor,Role,Action,EntityType,EntityId,Details\n";
    const rows = filtered
      .map(
        (l) =>
          `"${l.id}","${l.timestamp}","${l.actorName}","${l.actorRole}","${l.action}","${l.entityType}","${l.entityId}","${l.details.replace(/"/g, '""')}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Activity & Audit Logs</h1>
          <p className="mt-1 text-xs text-[#888]">
            Immutable governance ledger tracking administrative actions, security mutations, and workflow events.
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 rounded-xl border border-[#333] bg-[#181818] px-4 py-2 text-xs font-medium text-[#ccc] hover:bg-[#222] transition"
        >
          <Download size={14} /> Export CSV Ledger
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#262626] bg-[#141414] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#303030] bg-[#101010] px-3.5 py-2">
          <Search size={15} className="text-[#666]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit records by actor, action, or details..."
            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-[#666]"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-xl border border-[#303030] bg-[#101010] px-3 py-2 text-xs text-white outline-none"
        >
          <option value="ALL">All Recorded Actions</option>
          <option value="USER">User & Account Operations</option>
          <option value="ROLE">Role & Permission Changes</option>
          <option value="TASK">Task & Workflow Events</option>
          <option value="BLOCKER">Blocker Escalations</option>
          <option value="LOGIN">Authentication Events</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-2xl border border-[#262626] bg-[#141414]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#242424] bg-[#171717] text-[11px] font-semibold uppercase tracking-wider text-[#777]">
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-5">Log Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222] text-xs">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[#181818] transition">
                  <td className="py-3.5 px-5 text-[#888] font-mono text-[11px] whitespace-nowrap">
                    {new Date(item.timestamp).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-white">{item.actorName}</span>
                    <span className="ml-2 rounded bg-[#202020] px-1.5 py-0.5 text-[9px] text-[#888] font-mono">
                      {item.actorRole}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="rounded-md border border-[#303030] bg-[#1a1a1a] px-2 py-0.5 font-mono text-[10px] text-[#ccc]">
                      {item.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#aaa]">
                    {item.entityType} #{item.entityId}
                  </td>
                  <td className="py-3.5 px-5 text-[#ccc] leading-relaxed max-w-md">
                    {item.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
