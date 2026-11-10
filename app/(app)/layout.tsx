import { Shell } from "@/components/Shell";
import { UserMenu } from "@/components/UserMenu";
import { requireOwner } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireOwner();
  return <Shell user={<UserMenu />}>{children}</Shell>;
}
