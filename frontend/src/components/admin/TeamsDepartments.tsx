import React, { useState } from "react";
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  FolderKanban,
  Layers,
  MoveRight,
  Plus,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Team, User } from "../../types";
import { useAuth } from "../../context/AuthContext";
import {
  addAuditLog,
  getStoredTasks,
  getStoredTeams,
  getStoredUsers,
  saveStoredTeams,
  saveStoredUsers,
} from "../../services/mockDataStore";

export const TeamsDepartments: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [teams, setTeams] = useState<Team[]>(getStoredTeams);
  const [users, setUsers] = useState<User[]>(getStoredUsers);
  const tasks = getStoredTasks();

  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDept, setNewTeamDept] = useState("Engineering");
  const [newTeamLeadId, setNewTeamLeadId] = useState<number | undefined>(undefined);
  const [newTeamDesc, setNewTeamDesc] = useState("");

  const [movingUser, setMovingUser] = useState<User | null>(null);
  const [targetTeamName, setTargetTeamName] = useState("");

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const leadUser = users.find((u) => u.id === newTeamLeadId);

    const newTeam: Team = {
      id: Date.now(),
      name: newTeamName.trim(),
      department: newTeamDept.trim(),
      leadId: newTeamLeadId,
      leadName: leadUser ? leadUser.name : undefined,
      memberIds: leadUser ? [leadUser.id] : [],
      description: newTeamDesc.trim() || undefined,
    };

    const updated = [...teams, newTeam];
    setTeams(updated);
    saveStoredTeams(updated);
    setShowCreateTeamModal(false);
    setNewTeamName("");
    setNewTeamDesc("");

    if (currentUser) {
      addAuditLog(
        currentUser,
        "TEAM_CREATED",
        "Team",
        newTeam.id,
        `Created team "${newTeam.name}" in ${newTeam.department}`
      );
    }
  };

  const handleMoveUserTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movingUser || !targetTeamName) return;

    const oldTeam = movingUser.team;
    const updatedUsers = users.map((u) =>
      u.id === movingUser.id ? { ...u, team: targetTeamName } : u
    );

    // Update team memberIds
    const updatedTeams = teams.map((t) => {
      let memberIds = [...t.memberIds];
      if (t.name === oldTeam) {
        memberIds = memberIds.filter((id) => id !== movingUser.id);
      }
      if (t.name === targetTeamName && !memberIds.includes(movingUser.id)) {
        memberIds.push(movingUser.id);
      }
      return { ...t, memberIds };
    });

    setUsers(updatedUsers);
    setTeams(updatedTeams);
    saveStoredUsers(updatedUsers);
    saveStoredTeams(updatedTeams);

    if (currentUser) {
      addAuditLog(
        currentUser,
        "USER_TEAM_TRANSFERRED",
        "User",
        movingUser.id,
        `Transferred ${movingUser.name} from "${oldTeam}" to "${targetTeamName}"`
      );
    }

    setMovingUser(null);
  };

  const departments = Array.from(new Set(teams.map((t) => t.department)));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Teams & Departments</h1>
          <p className="mt-1 text-xs text-[#888]">
            Structure organizational departments, manage functional teams, assign leads, and allocate personnel.
          </p>
        </div>
        <button
          onClick={() => setShowCreateTeamModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e5e5e5] px-4 py-2.5 text-xs font-semibold text-[#141414] hover:bg-white transition"
        >
          <Plus size={15} /> Create Team
        </button>
      </div>

      {/* Department Cards Grid */}
      <div className="space-y-6">
        {departments.map((deptName) => {
          const deptTeams = teams.filter((t) => t.department === deptName);
          const deptMembers = users.filter((u) => u.department === deptName);

          return (
            <div
              key={deptName}
              className="rounded-2xl border border-[#262626] bg-[#141414] p-6 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#242424] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#202020] border border-[#333] text-white">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">{deptName} Department</h2>
                    <p className="text-xs text-[#777]">
                      {deptTeams.length} functional teams · {deptMembers.length} active employees
                    </p>
                  </div>
                </div>
              </div>

              {/* Teams within Department */}
              <div className="grid gap-4 md:grid-cols-2">
                {deptTeams.map((team) => {
                  const teamMembers = users.filter(
                    (u) => u.team === team.name || team.memberIds.includes(u.id)
                  );
                  const teamTasks = tasks.filter((t) => t.teamName === team.name || t.teamId === team.id);
                  const openTasks = teamTasks.filter((t) => t.status !== "DONE").length;

                  return (
                    <div
                      key={team.id}
                      className="rounded-xl border border-[#262626] bg-[#171717] p-5 space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-white">{team.name}</h3>
                          <p className="text-[11px] text-[#777] mt-0.5">
                            {team.description || "Core engineering and technical delivery team."}
                          </p>
                        </div>
                        <span className="rounded-md border border-[#333] bg-[#1d1d1d] px-2 py-0.5 text-[10px] text-[#aaa]">
                          {teamMembers.length} members
                        </span>
                      </div>

                      <div className="rounded-lg border border-[#2a2a2a] bg-[#121212] p-3 text-xs flex items-center justify-between">
                        <span className="text-[#777]">Team Lead:</span>
                        <span className="font-medium text-white">{team.leadName || "Not assigned"}</span>
                      </div>

                      {/* Team Member Avatars & List */}
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-[#777] mb-2">
                          <span>Team Roster</span>
                          <span>{openTasks} active tasks</span>
                        </div>
                        <div className="space-y-1.5">
                          {teamMembers.map((member) => (
                            <div
                              key={member.id}
                              className="flex items-center justify-between rounded-lg bg-[#141414] px-3 py-2 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#2a2a2a] text-[9px] font-bold text-white">
                                  {member.avatar || member.name.slice(0, 2).toUpperCase()}
                                </div>
                                <span className="text-[#ccc]">{member.name}</span>
                                {member.specialty && (
                                  <span className="rounded bg-[#222] px-1.5 py-0.2 text-[9px] text-[#888]">
                                    {member.specialty}
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => {
                                  setMovingUser(member);
                                  setTargetTeamName(teams.find((t) => t.name !== team.name)?.name || "");
                                }}
                                className="text-[10px] text-[#777] hover:text-white transition flex items-center gap-1"
                              >
                                Reallocate <MoveRight size={11} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Team Modal */}
      {showCreateTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#333] bg-[#141414] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <h3 className="text-base font-semibold text-white">Create New Team</h3>
              <button onClick={() => setShowCreateTeamModal(false)} className="text-[#777] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Distributed Cloud, Security Platform"
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">Department</label>
                <input
                  type="text"
                  required
                  value={newTeamDept}
                  onChange={(e) => setNewTeamDept(e.target.value)}
                  placeholder="e.g. Engineering, Product Design, Operations"
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">Team Lead</label>
                <select
                  value={newTeamLeadId || ""}
                  onChange={(e) => setNewTeamLeadId(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
                >
                  <option value="">Select team leader</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">Team Description</label>
                <input
                  type="text"
                  value={newTeamDesc}
                  onChange={(e) => setNewTeamDesc(e.target.value)}
                  placeholder="Primary engineering scope or mission..."
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTeamModal(false)}
                  className="rounded-xl border border-[#333] px-4 py-2 text-xs text-[#888] hover:bg-[#202020]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#e5e5e5] px-5 py-2 text-xs font-semibold text-[#141414] hover:bg-white"
                >
                  Create Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move User Team Modal */}
      {movingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#333] bg-[#141414] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
              <h3 className="text-base font-semibold text-white">Reallocate Employee</h3>
              <button onClick={() => setMovingUser(null)} className="text-[#777] hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleMoveUserTeam} className="space-y-4">
              <p className="text-xs text-[#888]">
                Moving <strong className="text-white">{movingUser.name}</strong> from current team{" "}
                <span className="text-[#ccc]">{movingUser.team}</span> to a new team.
              </p>

              <div>
                <label className="block text-xs font-medium text-[#aaa] mb-1">Target Team</label>
                <select
                  value={targetTeamName}
                  onChange={(e) => setTargetTeamName(e.target.value)}
                  className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMovingUser(null)}
                  className="rounded-xl border border-[#333] px-4 py-2 text-xs text-[#888] hover:bg-[#202020]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#e5e5e5] px-5 py-2 text-xs font-semibold text-[#141414] hover:bg-white"
                >
                  Confirm Reallocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
