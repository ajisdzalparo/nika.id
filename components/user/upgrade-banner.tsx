import { Button } from "@/components/ui/button";
import { IconCrown } from "@tabler/icons-react";
import Link from "next/link";

interface UpgradeBannerProps {
  feature: string;
  plan: string;
}

export function UpgradeBanner({ feature, plan }: UpgradeBannerProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
      <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-full flex items-center justify-center mb-4">
        <IconCrown size={24} />
      </div>
      <h3 className="font-serif text-lg font-medium text-zinc-900 dark:text-zinc-100">Fitur Premium</h3>
      <p className="text-sm text-zinc-500 max-w-xs mt-1 mb-4">
        Fitur <span className="font-medium text-zinc-900 dark:text-zinc-100">{feature}</span> hanya tersedia di paket <span className="font-bold text-amber-600 dark:text-amber-500">{plan}</span>.
      </p>
      <Link href="/upgrade">
        <Button variant="default" className="bg-amber-600 hover:bg-amber-700 text-white">
          Upgrade ke {plan}
        </Button>
      </Link>
    </div>
  );
}
