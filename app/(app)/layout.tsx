import { AppProviders } from "@/components/providers/AppProviders";
import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>
      <div className="shell">
        <Sidebar />
        <main className="main">{children}</main>
      </div>
    </AppProviders>
  );
}
