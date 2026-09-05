function formatDue(dateStr) {
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function TaskRow({ task, onCycle, onDelete }) {
  const today = new Date().toISOString().slice(0, 10);
  const overdue = task.dueDate < today && task.status !== "done";

  return (
    <div className={`task-row ${task.status}`}>
      <button
        className={`task-check ${task.status}`}
        onClick={() => onCycle(task.id)}
        aria-label={`Mark ${task.title} as ${
          task.status === "todo" ? "in progress" : task.status === "doing" ? "done" : "not started"
        }`}
      />
      <div className="task-body">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          <span>{task.course}</span>
          <span>·</span>
          <span className={`task-due${overdue ? " overdue" : ""}`}>
            {overdue ? "Overdue · " : ""}
            {formatDue(task.dueDate)}
          </span>
          <span className={`tag ${task.priority}`}>{task.priority}</span>
          {task.source !== "manual" && (
            <span className="tag" style={{ background: "var(--line)", color: "var(--ink-soft)" }}>
              {task.source}
            </span>
          )}
        </div>
      </div>
      {onDelete && (
        <button className="task-delete" onClick={() => onDelete(task.id)} aria-label="Delete task">
          ×
        </button>
      )}
    </div>
  );
}
