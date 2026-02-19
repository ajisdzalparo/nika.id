import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isFeatureEnabled } from "@/lib/limits";
import { IconMusic, IconMail, IconUser, IconLock } from "@tabler/icons-react";
import { MusicTab } from "./settings/music-tab";
import { EnvelopeTab } from "./settings/envelope-tab";
import { ProfileTab } from "./settings/profile-tab";
import { UserWithPlan } from "@/types/user";
import { WeddingData } from "@/types/wedding";

interface SettingsFormProps {
  user: UserWithPlan;
  invitation: { data: WeddingData };
}

export function SettingsForm({ user, invitation }: SettingsFormProps) {
  const canUseMusic = isFeatureEnabled(user.plan, "canUseMusic");
  const canUseDigitalGift = isFeatureEnabled(user.plan, "canUseDigitalGift");

  return (
    <Tabs defaultValue="music" className="w-full flex flex-col md:flex-row gap-8 items-start">
      <TabsList className="shrink-0 flex flex-col md:flex-row overflow-x-auto md:overflow-visible w-full md:w-64 bg-transparent gap-2 p-1 md:p-0 justify-start md:sticky md:top-24 self-start no-scrollbar">
        <TabsTrigger
          value="music"
          className="shrink-0 w-auto md:w-full justify-start px-4 py-3 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-zinc-200 dark:data-[state=active]:border-zinc-800 transition-all font-medium"
        >
          <IconMusic className="w-4 h-4 mr-2 md:mr-3" />
          <span className="hidden md:inline">Musik Latar</span>
          <span className="md:hidden">Musik</span>
          {!canUseMusic && <IconLock className="w-3.5 h-3.5 ml-auto text-zinc-400" />}
        </TabsTrigger>
        <TabsTrigger
          value="envelope"
          className="shrink-0 w-auto md:w-full justify-start px-4 py-3 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-zinc-200 dark:data-[state=active]:border-zinc-800 transition-all font-medium"
        >
          <IconMail className="w-4 h-4 mr-2 md:mr-3" />
          <span className="hidden md:inline">Amplop Digital</span>
          <span className="md:hidden">Amplop</span>
          {!canUseDigitalGift && <IconLock className="w-3.5 h-3.5 ml-auto text-zinc-400" />}
        </TabsTrigger>
        <TabsTrigger
          value="profile"
          className="shrink-0 w-auto md:w-full justify-start px-4 py-3 rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-zinc-200 dark:data-[state=active]:border-zinc-800 transition-all font-medium"
        >
          <IconUser className="w-4 h-4 mr-2 md:mr-3" />
          <span className="hidden md:inline">Profil Akun</span>
          <span className="md:hidden">Profil</span>
        </TabsTrigger>
      </TabsList>

      <div className="flex-1 min-w-0 space-y-6 w-full">
        <MusicTab invitation={invitation} isEnabled={canUseMusic} />
        <EnvelopeTab invitation={invitation} isEnabled={canUseDigitalGift} />
        <ProfileTab user={user} />
      </div>
    </Tabs>
  );
}
