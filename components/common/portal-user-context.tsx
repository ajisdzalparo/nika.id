"use client";

import * as React from "react";

export interface PortalUserInfo {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

const PortalUserContext = React.createContext<PortalUserInfo | null>(null);

export function PortalUserProvider({
  user,
  children,
}: {
  user: PortalUserInfo;
  children: React.ReactNode;
}) {
  return <PortalUserContext.Provider value={user}>{children}</PortalUserContext.Provider>;
}

export function usePortalUser(): PortalUserInfo | null {
  return React.useContext(PortalUserContext);
}
