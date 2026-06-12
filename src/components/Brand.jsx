import { Activity } from "lucide-react";
import { Link } from "react-router-dom";

export default function Brand({ compact = false, light = false }) {
  return (
    <Link to="/" className={`flex items-center gap-3 font-extrabold ${light ? "text-white" : "text-ink"}`}>
      <span className={`grid h-10 w-10 place-items-center rounded-2xl ${light ? "bg-white/15" : "bg-ink text-white"}`}>
        <Activity size={20} />
      </span>
      {!compact && <span className="text-lg tracking-tight">Remedy<span className={light ? "text-teal-100" : "text-teal-500"}>Quest</span></span>}
    </Link>
  );
}
