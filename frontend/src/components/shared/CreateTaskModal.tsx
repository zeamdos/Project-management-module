import React, { useState } from "react";
import { ListTodo, Plus, Trash2, X } from "lucide-react";
import { Project, Task, TaskPriority, TaskStatus, User } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { addAuditLog, addNotification } from "../../services/mockDataStore";

interface CreateTaskModalProps {
  projects: Project[];
  users: User[];
  defaultStatus?: TaskStatus;
  onClose: () => void;
  onTaskCreated: (newTask: Task) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  projects,
  users,
  defaultStatus = "TODO",
  onClose,
  onTaskCreated,
}) => {
  const { user } = useAuth();
  const [projectId, setProjectId] = useState<number>(projects[0]?.id || 1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [criteria, setCriteria] = useState<string[]>([""]);
  const [assigneeId, setAssigneeId] = useState<number | undefined>(undefined);
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [dueDate, setDueDate] = useState("");
  const [labels, setLabels] = useState("");

  const developers = users.filter(
    (u) => u.role === "DEVELOPER" || u.customRoleId === "SENIOR_DEVELOPER"
  );

  const handleAddCriteria = () => {
    setCriteria([...criteria, ""]);
  };

  const handleCriteriaChange = (index: number, val: string) => {
    const copy = [...criteria];
    copy[index] = val;
    setCriteria(copy);
  };

  const handleRemoveCriteria = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    const matchedProject = projects.find((p) => p.id === projectId);
    const assignedUser = users.find((u) => u.id === assigneeId);

    const newTask: Task = {
      id: Math.floor(Math.random() * 8000) + 1000,
      projectId,
      projectName: matchedProject?.name || "Project",
      title: title.trim(),
      description: description.trim() || undefined,
      acceptanceCriteria: criteria.filter((c) => c.trim().length > 0),
      status,
      priority,
      assigneeId: assignedUser?.id || null,
      assignee: assignedUser
        ? {
            id: assignedUser.id,
            name: assignedUser.name,
            email: assignedUser.email,
            avatar: assignedUser.avatar,
            specialty: assignedUser.specialty,
          }
        : null,
      createdById: user?.id,
      createdByName: user?.name,
      dueDate: dueDate || undefined,
      labels: labels
        .split(",")
        .map((l) => l.trim().toLowerCase())
        .filter(Boolean),
      comments: [],
      activity: [
        {
          id: `act-${Date.now()}`,
          taskId: 0,
          actorId: user?.id || 0,
          actorName: user?.name || "Author",
          action: "Task Created",
          details: `Card created in ${status}`,
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    if (assignedUser) {
      addNotification(
        assignedUser.id,
        "New Task Assignment",
        `You have been assigned to task "${newTask.title}" in ${newTask.projectName}`,
        "TASK",
        `task-${newTask.id}`
      );
    }

    if (user) {
      addAuditLog(user, "TASK_CREATED", "Task", newTask.id, `Created task "${newTask.title}"`);
    }

    onTaskCreated(newTask);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-6 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl border border-[#333] bg-[#141414] p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-[#262626] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#202020] border border-[#333] text-white">
              <ListTodo size={16} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Create Task Card</h3>
              <p className="text-xs text-[#888]">Define requirement, assignee, and target deadline.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#777] hover:text-white">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#aaa] mb-1">Target Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(Number(e.target.value))}
              className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#aaa] mb-1">Task Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement Webhook HMAC Verification"
              className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none focus:border-[#777]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#aaa] mb-1">Description & Context</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain technical expectations and deliverable..."
              className="w-full rounded-xl border border-[#333] bg-[#101010] p-3 text-xs text-white outline-none focus:border-[#777] resize-none"
            />
          </div>

          {/* Acceptance Criteria */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[#aaa]">Acceptance Criteria</label>
              <button
                type="button"
                onClick={handleAddCriteria}
                className="text-[11px] text-[#aaa] hover:text-white flex items-center gap-1"
              >
                <Plus size={12} /> Add Criteria
              </button>
            </div>
            <div className="space-y-2">
              {criteria.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleCriteriaChange(idx, e.target.value)}
                    placeholder={`Criterion #${idx + 1}`}
                    className="flex-1 rounded-xl border border-[#333] bg-[#101010] px-3 py-2 text-xs text-white outline-none focus:border-[#666]"
                  />
                  {criteria.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCriteria(idx)}
                      className="text-[#666] hover:text-red-400 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#aaa] mb-1">Assigned Developer</label>
              <select
                value={assigneeId || ""}
                onChange={(e) => setAssigneeId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
              >
                <option value="">Unassigned</option>
                {developers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.specialty ? `(${d.specialty})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#aaa] mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#aaa] mb-1">Workflow Column</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2.5 text-xs text-white outline-none"
              >
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="IN_REVIEW">In Review</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#aaa] mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#aaa] mb-1">Labels (Comma separated)</label>
            <input
              type="text"
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              placeholder="frontend, security, urgent"
              className="w-full rounded-xl border border-[#333] bg-[#101010] px-3.5 py-2 text-xs text-white outline-none focus:border-[#777]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#333] px-4 py-2 text-xs text-[#888] hover:bg-[#202020]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#e5e5e5] px-5 py-2 text-xs font-semibold text-[#141414] hover:bg-white transition"
            >
              Create Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
