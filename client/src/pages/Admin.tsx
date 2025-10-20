import { useState, useEffect } from "react";
import { m } from "framer-motion";
import { useAtom } from "jotai";
import { isAdminAtom, userAtom } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { StatusMessage } from "./components/ui/StatusMessage";
import { AdminHeader } from "./components/admin/AdminHeader";
import { SuppliersUploadSection } from "./components/admin/SuppliersUploadSection";
import { UploadStats } from "./components/admin/UploadStats";
import { UserRequestsSection } from "./components/admin/UserRequestsSection";


interface UploadResponse {
  success: boolean;
  message: string;
  newRecords: number;
  updatedRecords: number;
  unchangedRecords: number;
  processedRecords: number;
  failedRecords: number;
}

function Admin() {
  const [user] = useAtom(userAtom);
  const [isAdmin] = useAtom(isAdminAtom);
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [uploadSuccess, setUploadSuccess] = useState<boolean | null>(null);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(
    null,
  );

  // Автоматическая аутентификация если isAdmin = true
  useEffect(() => {
    if (isAdmin) {
      setIsAuthenticated(true);
    } else {
      navigate("/"); // Редирект на главную если не админ
    }
  }, [isAdmin, navigate]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Проверка прав доступа...</div>
      </div>
    );
  }

  return (
    <div className="from-blue-25 min-h-screen w-screen bg-gradient-to-br to-white">
      <div className="container mx-auto px-4 py-8 md:px-6">
        <m.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto max-w-6xl"
        >
          <AdminHeader onNavigateHome={() => navigate("/")} />

          {/* Секция загрузки данных поставщиков */}
          <SuppliersUploadSection
            user={user}
            onUploadResponse={setUploadResponse}
            onUploadMessage={setUploadMessage}
            onUploadSuccess={setUploadSuccess}
          />

          {/* Сообщение о статусе */}
          {uploadMessage && (
            <StatusMessage message={uploadMessage} success={uploadSuccess} />
          )}

          {/* Статистика загрузки */}
          {uploadResponse && <UploadStats uploadResponse={uploadResponse} />}

          {/* Секция запросов пользователей */}
          <UserRequestsSection user={user} />
        </m.div>
      </div>
    </div>
  );
}

export default Admin;
