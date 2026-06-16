import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";

export default function Sidebar({ title, items, onLogout }) {
  return (
    <aside className="flex h-screen w-64 flex-col bg-[#111111] text-white">
      <div className="border-b border-white/10 px-6 py-5">
        <p className="text-xs uppercase tracking-widest text-white/50">Family Academy</p>
        <p className="mt-1 text-lg font-semibold">{title}</p>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "block rounded-md px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white",
                isActive && "bg-white/10 text-white font-medium"
              )
            }
          >
            <span className="flex flex-1 items-center justify-between gap-2">
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-[#111111]">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-4">
        <button
          type="button"
          onClick={onLogout}
          className="w-full rounded-md border border-white/20 px-3 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
