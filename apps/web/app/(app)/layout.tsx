import { ProofProvider } from "@/components/provider";
import { Shell } from "@/components/shell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProofProvider>
      <Shell>{children}</Shell>
    </ProofProvider>
  );
}
