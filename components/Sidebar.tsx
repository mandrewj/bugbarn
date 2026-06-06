"use client";

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
  const counts: Record<string, number> = { collections: collections.length, sops: sops.length };

  return (
    <aside className="sidebar">
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
  );
}
