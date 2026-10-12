import { Activity } from "lucide-react";
import { Link } from "react-router-dom";

export default function Brand({ compact = false, light = false }) {
  return (
    <Link to="/" className={`flex items-center gap-3 font-extrabold ${light ? "text-white" : "text-ink"}`}>
      <span className={`relative grid h-10 w-10 place-items-center overflow-hidden rounded-2xl shadow-lg ring-1 ring-[#c9a45c]/40 ${light ? "bg-white/10 text-[#e6cf9b]" : "lux-dark text-[#e6cf9b]"}`}>
        <span className="absolute inset-x-2 top-0 h-px bg-white/40" />
        <Activity size={20} />
      </span>
      {!compact && <span className="text-lg tracking-tight">Remedy<span className={`font-display ms-0.5 text-[1.2rem] font-semibold italic ${light ? "gold-text-light" : "gold-text"}`}>Quest</span></span>}
    </Link>
  );
}
