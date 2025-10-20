import { useAtom } from "jotai";
import { userAtom, isAuthAtom, isAdminAtom } from "@/store/authStore";
import type { User } from "@/types/auth.type";

export const useAuth = () => {
  const [user, setUser] = useAtom(userAtom);
  const [, setIsAuth] = useAtom(isAuthAtom);
  const [, setIsAdmin] = useAtom(isAdminAtom);

  const login = (userData: User) => {
    setUser(userData);
    setIsAuth(true);
    setIsAdmin(userData.role === "ADMIN");
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("isAuth");
    localStorage.removeItem("isAdmin");
    setUser(null);
    setIsAuth(false);
    setIsAdmin(false);
    window.location.reload();
  };

  const isAuthenticated = !!user?.token;

  return {
    user,
    login,
    logout,
    isAuthenticated,
  };
};
