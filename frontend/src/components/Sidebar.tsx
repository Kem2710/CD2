"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Mic, PhoneCall, Target, Ticket } from "lucide-react";

const NAV = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/calls", label: "Cuộc gọi", icon: PhoneCall },
  { href: "/tickets", label: "Khiếu nại", icon: Ticket },
  { href: "/leads", label: "Khách tiềm năng", icon: Target },
];

export default function Sidebar() {
  const pathname = usePathname();
  const active = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Thanh trên cho màn hình nhỏ */}
      <nav className="flex gap-1 overflow-x-auto bg-slate-900 px-3 py-2 md:hidden">
        {NAV.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
              active(href) ? "bg-indigo-600 text-white" : "text-slate-300"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Thanh bên cho màn hình lớn */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-slate-900 text-slate-200 md:flex">
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600">
            <Mic size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight text-white">Voice AI</p>
            <p className="text-xs text-slate-400">Call Automation</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                active(href)
                  ? "bg-indigo-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>

        <p className="px-6 py-5 text-xs text-slate-500">
          n8n · NestJS · Next.js · PostgreSQL
        </p>
      </aside>
    </>
  );
}