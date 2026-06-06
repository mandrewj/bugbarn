"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants";
import { Icon, BrandMark } from "@/components/Icon";
import { useData } from "@/components/providers/DataProvider";
import { useChangeKeeper } from "@/components/modals/KeeperModal";

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar() {
  const pathname = usePathname();
  const { collections, sops, lastKeeper } = useData();
  const changeKeeper = useChangeKeeper();
  const [open, setOpen] = useState(false);
  const counts: Record<string, number> = { collections: collections.length, sops: sops.length };

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile-only top app bar */}
      <div className="mtopbar">
        <button className="mtopbar-burger" aria-label="Open menu" onClick={() => setOpen(true)}>
          <Icon name="menu" />
        </button>
        <div className="mtopbar-brand">
          <div className="mark">
            <BrandMark />
          </div>
          <b>Bug Barn</b>
        </div>
        {lastKeeper ? (
          <button className="mtopbar-keeper" onClick={changeKeeper} title="Change keeper">
            {lastKeeper}
          </button>
        ) : null}
      </div>

      {open ? <div className="mscrim" onClick={() => setOpen(false)} /> : null}

      <aside className={`sidebar ${open ? "open" : ""}`}>
        <button className="sidebar-close" aria-label="Close menu" onClick={() => setOpen(false)}>
          <Icon name="x" />
        </button>
        <div className="brand">
          <div className="mark">
            <BrandMark />
          </div>
          <div>
            <b>Bug Barn</b>
            <small>Living Collections</small>
          </div>
        </div>
        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <Link key={item.key} href={item.href} className={isActive(item.href, pathname) ? "on" : ""}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {counts[item.key] != null ? <span className="count">{counts[item.key]}</span> : null}
            </Link>
          ))}
        </nav>
        {lastKeeper ? (
          <div className="keeperbar">
            <div>
              <small>On shift</small>
              <b>{lastKeeper}</b>
            </div>
            <button type="button" className="keeper-switch" onClick={changeKeeper}>
              Change
            </button>
          </div>
        ) : null}
        <div className="foot">
          PURDUE ENTOMOLOGY
          <br />
          created by the Insect Diversity
          <br />
          and Diagnostics Lab
        </div>
      </aside>
    </>
  );
}
