import { useState } from "react";
import { useGame } from "../../state/GameContext";

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="card w-full flex justify-between items-center text-sm" role="switch" aria-checked={on}>
      <span>{label}</span>
      <span className={`switch ${on ? "on" : ""}`}><span /></span>
    </button>
  );
}

export function SettingsPanel() {
  const g = useGame();
  const { s } = g;
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      <h3 className="section-title">Audio & display</h3>
      <Toggle label="Sound effects" on={s.settings.sound} onChange={(v) => g.act.patchSettings({ sound: v })} />
      <label className="card block text-sm">
        <span className="flex justify-between"><span>Volume</span><span className="text-white/50 tabular-nums">{Math.round(s.settings.volume * 100)}%</span></span>
        <input type="range" min={0} max={1} step={0.05} value={s.settings.volume} onChange={(e) => g.act.patchSettings({ volume: Number(e.target.value) })} className="w-full mt-1 accent-amber-400" />
      </label>
      <Toggle label="3D monsters (turn off on slow devices)" on={s.settings.graphics3d} onChange={(v) => g.act.patchSettings({ graphics3d: v })} />
      <Toggle label="Floating damage numbers" on={s.settings.showFloats} onChange={(v) => g.act.patchSettings({ showFloats: v })} />
      <Toggle label="Reduced motion" on={s.settings.reducedMotion} onChange={(v) => g.act.patchSettings({ reducedMotion: v })} />
      <label className="card block text-sm">
        <span>Number format</span>
        <select className="mt-1 w-full rounded-lg bg-black/40 border border-white/10 p-2" value={s.settings.numberFormat} onChange={(e) => g.act.patchSettings({ numberFormat: e.target.value as typeof s.settings.numberFormat })}>
          <option value="short">Short (1.23M, 4.5aa)</option>
          <option value="scientific">Scientific (1.23e6)</option>
          <option value="engineering">Engineering (1.23e6, 45.6e9)</option>
          <option value="full">Full (1,234,567)</option>
        </select>
      </label>

      <h3 className="section-title pt-2">Save</h3>
      <div className="grid grid-cols-2 gap-1.5">
        <button onClick={g.act.saveNow} className="btn-gold py-2">💾 Save now</button>
        <button
          onClick={() => {
            const data = g.act.exportSave();
            void navigator.clipboard?.writeText(data).then(() => setMsg("Save copied to clipboard."), () => { setText(data); setMsg("Copy the save text below."); });
          }}
          className="card text-sm text-center"
        >
          📤 Export
        </button>
      </div>
      <textarea className="w-full h-20 rounded-lg bg-black/40 border border-white/10 p-2 text-[11px] font-mono" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste a save here to import" />
      <button onClick={() => setMsg(g.act.importSave(text) ?? "Save imported!")} disabled={!text.trim()} className="card w-full text-sm text-center disabled:opacity-40">📥 Import save</button>
      {msg && <p className="text-xs text-center text-white/60">{msg}</p>}
      <button onClick={() => g.setModal("reset")} className="w-full rounded-lg py-2 bg-red-900/30 text-red-300 border border-red-500/30 text-sm">Reset all progress</button>

      <h3 className="section-title pt-2">Keyboard</h3>
      <div className="card text-[11px] text-white/60 grid grid-cols-2 gap-y-1">
        <span><kbd>1</kbd>–<kbd>9</kbd> skills</span>
        <span><kbd>A</kbd> auto-progress</span>
        <span><kbd>←</kbd> <kbd>→</kbd> change zone</span>
        <span><kbd>Q</kbd> cycle buy amount</span>
      </div>
      <p className="text-[10px] text-white/30 text-center pt-2">Realm Clicker · an original idle RPG · saves stay in this browser and are signed — edited saves are rejected</p>
    </div>
  );
}
