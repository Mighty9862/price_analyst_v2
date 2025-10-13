import { atomWithStorage } from "jotai/utils";

export interface User {
  token: string;
  role: "USER" | "ADMIN";
}

export const userAtom = atomWithStorage<User | null>("user", null);
export const isAuthAtom = atomWithStorage<boolean>("isAuth", false);
export const isAdminAtom = atomWithStorage<boolean>("isAdmin", false);
