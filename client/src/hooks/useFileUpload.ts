import { useState } from "react";
import { useAuth } from "./useAuth";

export const useFileUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [uploadSuccess, setUploadSuccess] = useState<boolean | null>(null);
  const { isAuthenticated } = useAuth();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setUploadMessage("");
    setUploadSuccess(null);
  };

  const resetFile = () => {
    setSelectedFile(null);
    const fileInput = document.getElementById(
      "file-upload",
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const validateAuth = (): boolean => {
    if (!isAuthenticated) {
      setUploadMessage("Для анализа цен необходимо зарегистрироваться");
      setUploadSuccess(false);
      return false;
    }
    return true;
  };

  return {
    selectedFile,
    uploadMessage,
    uploadSuccess,
    setUploadMessage,
    setUploadSuccess,
    handleFileSelect,
    resetFile,
    validateAuth,
  };
};
