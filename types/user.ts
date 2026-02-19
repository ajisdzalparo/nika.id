import { PlanType } from "@/lib/limits";
import { WeddingData } from "./wedding";

export interface UserWithPlan {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  plan: PlanType;
  planExpiresAt?: Date | string | null;
  templateSlug?: string | null;
  weddingDate?: Date | string | null;
  invitationSlug: string | null;
  invitation?: {
    data: WeddingData;
  } | null;
}
