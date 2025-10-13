import { useAtom } from "jotai";
import Button from "../ui/Button";
import { isAdminAtom, isAuthAtom } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import type { Dispatch, SetStateAction } from "react";

function Navbar({ setIsAuthModalOpen }: { setIsAuthModalOpen: Dispatch<SetStateAction<boolean>> }) {
  const [isAuth] = useAtom(isAuthAtom);
  const [isAdmin] = useAtom(isAdminAtom);

  const navigate = useNavigate();

  // Функция выхода
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("isAuth");
    localStorage.removeItem("isAdmin");
    window.location.reload();
  };

  return (
    <div className="fixed top-4 right-4 z-20">
      {isAuth ? (
        <div className="flex items-center gap-4">
          <div className="text-sm text-blue-700">
            {isAdmin && (
              <Button onClick={() => navigate("/admin")}>Админ-панель</Button>
            )}
          </div>
          <Button onClick={() => navigate("/profile")}>Личный кабинет</Button>

          <Button onClick={handleLogout}>Выйти</Button>
        </div>
      ) : (
        <Button onClick={() => setIsAuthModalOpen(true)}>Войти</Button>
      )}
    </div>
  );
}

export default Navbar;
