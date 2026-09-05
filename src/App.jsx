import { useState } from "react";
import { useAppData } from "./data/store";
import Rail from "./components/Rail";
import Dashboard from "./components/Dashboard";
import Tasks from "./components/Tasks";
import Focus from "./components/Focus";
import Inbox from "./components/Inbox";
import "./app.css";

const PAGES = {
  dashboard: { label: "Today", Component: Dashboard },
  tasks: { label: "Tasks", Component: Tasks },
  focus: { label: "Focus", Component: Focus },
  inbox: { label: "Inbox", Component: Inbox },
};

export default function App() {
  const [page, setPage] = useState("dashboard");
  const data = useAppData();
  const { Component } = PAGES[page];

  return (
    <div className="shell">
      <Rail page={page} onNavigate={setPage} pages={PAGES} />
      <main className="shell-main">
        <Component data={data} onNavigate={setPage} />
      </main>
    </div>
  );
}
