"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LIVE_ENABLED =
  process.env.NEXT_PUBLIC_COMPASS_LIVE === "true" ||
  process.env.NEXT_PUBLIC_COMPASS_LIVE === "1";

const LINKS = [
  ...(LIVE_ENABLED ? [{ href: "/compass", label: "Compass" }] : []),
  { href: "/", label: "Contacts" },
  { href: "/outreach", label: "Outreach" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      {LINKS.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? "active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
