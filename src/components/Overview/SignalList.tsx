import { UISignal } from "@/services/signalsApi";

export default function SignalList({
  items, height = "max-h-80", scroll = false, emptyText = "No items",
}: { items: UISignal[]; height?: string; scroll?: boolean; emptyText?: string }) {
  const container = scroll ? `${height} overflow-auto` : "";
  return (
    <div className={`bg-[#111827] rounded-2xl p-4 ${container}`}>
      {items.length === 0 ? (
        <div className="text-gray-400 text-sm">{emptyText}</div>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <div key={s.id} className="flex items-center justify-between border-b border-gray-800 pb-2 last:border-none">
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold">{s.symbol}</div>
                {s.title && <div className="text-xs text-gray-300">{s.title}</div>}
                {s.tags?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {s.tags.map((t) => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-lg bg-gray-700/50 text-gray-200">{t}</span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-4 text-xs">
                {typeof s.confidence === "number" && <span className="text-blue-300">Conf: {s.confidence.toFixed(1)}%</span>}
                {typeof s.change_pct === "number" && <span className={`${s.change_pct>=0?"text-green-400":"text-red-400"}`}>{s.change_pct.toFixed(2)}%</span>}
                {typeof s.price === "number" && <span className="text-gray-300">${s.price.toLocaleString()}</span>}
                {s.time && <span className="text-gray-500">{s.time}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}