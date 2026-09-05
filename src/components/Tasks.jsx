import { useState } from "react";
import TaskRow from "./TaskRow";

const FILTERS = ["all", "todo", "doing", "done"];

export default function Tasks({ data }) {
  const { tasks, addTask, deleteTask, cycleStatus } = data;
  const [filter, setFilter] = useState("all");
  const [title, setTitle] = useState("");
  const [course, setCourse] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState("medium");

  const visible = tasks
    .filter((t) => filter === "all" || t.status === filter)
    .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({ title: title.trim(), course: course.trim() || "General", dueDate, priority });
    setTitle("");
    setCourse("");
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Tasks</h1>
          <p>{tasks.filter((t) => t.status !== "done").length} open</p>
        </div>
        <div className="stat-row" style={{ gap: 8 }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              className="rail-item"
              style={{
                borderLeft: "none",
                background: filter === f ? "var(--ink)" : "var(--paper-raised)",
                color: filter === f ? "var(--paper)" : "var(--ink-soft)",
                border: "1px solid var(--line-strong)",
                borderRadius: 20,
                padding: "6px 14px",
                fontSize: 12.5,
              }}
              onClick={() => setFilter(f)}
            >
              {f === "todo" ? "to do" : f}
            </button>
          ))}
        </div>
      </div>

      <form className="add-task-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Add a task — e.g. Finish lab report"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Course"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          style={{ width: 140 }}
        />
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit">Add</button>
      </form>

      <div className="ruled-list">
        {visible.length === 0 && <p className="empty-note">Nothing here yet.</p>}
        {visible.map((t) => (
          <TaskRow key={t.id} task={t} onCycle={cycleStatus} onDelete={deleteTask} />
        ))}
      </div>
    </>
  );
}
