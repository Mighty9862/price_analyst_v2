import type { User } from "@/types/auth.type";
import { atomWithStorage } from "jotai/utils";

export const userAtom = atomWithStorage<User | null>("user", null);
export const isAuthAtom = atomWithStorage<boolean>("isAuth", false);
export const isAdminAtom = atomWithStorage<boolean>("isAdmin", false);
