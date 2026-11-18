"use client";

import { Check, Copy, Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const agents = ["KakoBuy", "HipoBuy", "OOPBuy", "ACBuy", "AllChinaBuy"] as const;
type Agent = (typeof agents)[number];
type AgentAction = "default" | "copy";
const storageKey = "findthat:default-agent";

export function AgentLinks() {
  const [preferred, setPreferred] = useState<Agent>(agents[0]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState<AgentAction>("copy");
  const [notice, setNotice] = useState<{ text: string; success: boolean } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const match = agents.find((agent) => agent === saved);
      if (match) setPreferred(match);
    } catch {
      // The in-memory default still works when storage is unavailable.
    }
    return () => {
      if (timeout.current !== null) clearTimeout(timeout.current);
    };
  }, []);

  function announce(text: string, success = true) {
    if (timeout.current !== null) clearTimeout(timeout.current);
    setNotice({ text, success });
    timeout.current = setTimeout(() => setNotice(null), 1750);
  }

  async function copy(agent: Agent) {
    const sample = agent === agents[0] ? "Testing copy function" : `Testing copy function (${agent})`;
    try {
      await navigator.clipboard.writeText(sample);
      announce(`${agent} test link copied`);
    } catch {
      announce("Couldn’t copy to your clipboard", false);
    }
  }

  function open(action: AgentAction, button: HTMLButtonElement) {
    opener.current = button;
    setMode(action);
    setMenuOpen(true);
    setNotice(null);
    dialog.current?.showModal();
  }

  function chooseDefault(agent: Agent) {
    setPreferred(agent);
    try { localStorage.setItem(storageKey, agent); } catch { /* Keep the session preference. */ }
    dialog.current?.close();
    announce(`Default set to ${agent}`);
  }

  const feedback = <span role="status" className={notice ? "agent-notice agent-notice-visible" : "agent-notice"}>
    {notice?.success && <Check size={15} aria-hidden="true" />}{notice?.text}
  </span>;

  return (
    <div className="agent-links">
      <div className="agent-actions">
        <div className="agent-primary">
          <button type="button" className="agent-copy" aria-label={`Copy link for ${preferred}`} onClick={() => void copy(preferred)}>
            <Copy size={17} aria-hidden="true" /> Copy link <span>{preferred}</span>
          </button>
          <button type="button" className="agent-switch" aria-haspopup="dialog"
            onClick={(event) => open("default", event.currentTarget)}>Switch default</button>
        </div>
        <button type="button" className="agent-more" aria-haspopup="dialog"
          onClick={(event) => open("copy", event.currentTarget)}><Plus size={17} aria-hidden="true" /> More agents</button>
      </div>
      <div className="agent-inline-feedback">{!menuOpen && feedback}</div>

      <dialog ref={dialog} className="agent-dialog" aria-labelledby="agent-dialog-title"
        onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}
        onClose={() => { setMenuOpen(false); opener.current?.focus({ preventScroll: true }); }}>
        <div className="agent-dialog-panel">
          <header className="agent-dialog-header">
            <div>
              <h2 id="agent-dialog-title">{mode === "default" ? "Switch default agent" : "More agents"}</h2>
              <p>{mode === "default" ? "Choose the agent used by Copy link." : "Copy a test link for another agent."}</p>
            </div>
            <button type="button" className="gallery-control" aria-label="Close agent menu"
              onClick={() => dialog.current?.close()}><X size={20} aria-hidden="true" /></button>
          </header>
          <div className="agent-list">
            {agents.map((agent) => <button key={agent} type="button" className="agent-option"
              aria-label={mode === "copy" ? `Copy ${agent} link` : `Set ${agent} as default`}
              aria-pressed={mode === "default" ? agent === preferred : undefined}
              onClick={() => { if (mode === "default") chooseDefault(agent); else void copy(agent); }}>
              <span>{agent}{agent === preferred && <small>Default</small>}</span>
              {mode === "copy" ? <Copy size={16} aria-hidden="true" /> : agent === preferred ? <Check size={18} aria-hidden="true" /> : null}
            </button>)}
          </div>
          <div className="agent-menu-feedback">{menuOpen && feedback}</div>
        </div>
      </dialog>
    </div>
  );
}
