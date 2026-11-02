import React, { useState } from "react";
import { AlertCircle, AlertTriangle, Bell, Check, CheckCheck, Clock, ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getStoredNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../services/mockDataStore";
import { NotificationItem } from "../../types";

interface NotificationDropdownProps {
  onSelectTask?: (taskId: number) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onSelectTask }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() =>
    getStoredNotifications(user?.id)
  );

  const refresh = () => {
    setNotifications(getStoredNotifications(user?.id));
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const handleMarkOne = (id: string | number, link?: string) => {
    markNotificationRead(id);
    refresh();
    if (link && link.startsWith("task-") && onSelectTask) {
      const taskId = parseInt(link.replace("task-", ""), 10);
      if (!isNaN(taskId)) {
        onSelectTask(taskId);
        setOpen(false);
      }
    }
  };

  const handleMarkAll = () => {
    if (!user) return;
    markAllNotificationsRead(user.id);
    refresh();
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen((s) => !s);
          refresh();
        }}
        className="relative rounded-lg p-2 text-[#888] transition hover:bg-[#202020] hover:text-white"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200 text-[9px] font-bold text-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-40 w-80 sm:w-96 rounded-2xl border border-[#2b2b2b] bg-[#141414] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#242424] px-4 py-3 bg-[#171717]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[#2a2a2a] px-2 py-0.5 text-[10px] text-[#aaa]">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="inline-flex items-center gap-1 text-[11px] text-[#888] hover:text-white transition"
                >
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-[#222]">
              {notifications.length > 0 ? (
                notifications.map((notif) => {
                  const isUnread = !notif.readAt;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleMarkOne(notif.id, notif.link)}
                      className={`p-3.5 transition cursor-pointer flex items-start gap-3 ${
                        isUnread ? "bg-[#181818] hover:bg-[#1f1f1f]" : "hover:bg-[#161616]"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notif.kind === "BLOCKER" ? (
                          <AlertTriangle size={15} className="text-red-400" />
                        ) : notif.kind === "REVIEW" ? (
                          <Clock size={15} className="text-amber-400" />
                        ) : notif.kind === "TASK" ? (
                          <AlertCircle size={15} className="text-neutral-300" />
                        ) : (
                          <Bell size={15} className="text-[#888]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-medium truncate ${isUnread ? "text-white" : "text-[#aaa]"}`}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-[#666] shrink-0">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-[#777] line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>
                      {isUnread && (
                        <div className="h-2 w-2 rounded-full bg-neutral-300 mt-1.5 shrink-0" />
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="p-8 text-center text-xs text-[#666]">No notifications</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
