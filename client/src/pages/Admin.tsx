import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Button from "./components/ui/Button";
import FileIcon from "./components/ui/icons/FileIcon";
import SuccessIcon from "./components/ui/icons/SuccessIcon";
import ErrorIcon from "./components/ui/icons/ErrorIcon";
import DownloadIcon from "./components/ui/icons/DownloadIcon";
import ExportIcon from "./components/ui/icons/ExportIcon";
import ChevronDownIcon from "./components/ui/icons/ChevronDownIcon";
import { useAtom } from "jotai";
import { isAdminAtom, userAtom } from "@/store/authStore";
import { useNavigate } from "react-router-dom";

interface UploadResponse {
  success: boolean;
  message: string;
  newRecords: number;
  updatedRecords: number;
  unchangedRecords: number;
  processedRecords: number;
  failedRecords: number;
}

interface FileContent {
  [key: string]: any;
}

interface UserRequest {
  fullName: string;
  inn: string;
  phone: string;
  fileContent?: FileContent[];
  timestamp: string;
}

interface CompanyGroup {
  fullName: string;
  inn: string;
  phone: string;
  requests: UserRequest[];
}

// Функция для парсинга статистики из сообщения
const parseStatsFromMessage = (message: string) => {
  const stats = {
    added: 0,
    updated: 2,
    unchanged: 890,
    skippedDuplicates: 0,
    errors: 0,
    time: "0 мс",
  };

  try {
    // Ищем числа в сообщении по шаблонам
    const addedMatch = message.match(/Добавлено:\s*(\d+)/);
    const updatedMatch = message.match(/обновлено:\s*(\d+)/);
    const unchangedMatch = message.match(/без изменений:\s*(\d+)/);
    const skippedMatch = message.match(/пропущено дубликатов:\s*(\d+)/);
    const errorsMatch = message.match(/ошибок:\s*(\d+)/);
    const timeMatch = message.match(/Время:\s*([^]+)$/);

    if (addedMatch) stats.added = parseInt(addedMatch[1]);
    if (updatedMatch) stats.updated = parseInt(updatedMatch[1]);
    if (unchangedMatch) stats.unchanged = parseInt(unchangedMatch[1]);
    if (skippedMatch) stats.skippedDuplicates = parseInt(skippedMatch[1]);
    if (errorsMatch) stats.errors = parseInt(errorsMatch[1]);
    if (timeMatch) stats.time = timeMatch[1].trim();
  } catch (error) {
    console.error("Ошибка парсинга сообщения:", error);
  }

  return stats;
};

// Функция для группировки запросов по компаниям
const groupRequestsByCompany = (requests: UserRequest[]): CompanyGroup[] => {
  const groups: { [key: string]: CompanyGroup } = {};

  requests.forEach((request) => {
    const key = `${request.inn}_${request.fullName}`;

    if (!groups[key]) {
      groups[key] = {
        fullName: request.fullName,
        inn: request.inn,
        phone: request.phone,
        requests: [],
      };
    }

    groups[key].requests.push(request);
  });

  // Сортируем запросы внутри каждой компании по дате (новые сверху)
  Object.values(groups).forEach((group) => {
    group.requests.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  });

  return Object.values(groups).sort((a, b) =>
    a.fullName.localeCompare(b.fullName),
  );
};

function Admin() {
  const API_URL = import.meta.env.VITE_API_URL;

  const [user] = useAtom(userAtom);
  const [isAdmin] = useAtom(isAdminAtom);
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [downloadTemplateLoading, setDownloadTemplateLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(
    null,
  );
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [uploadSuccess, setUploadSuccess] = useState<boolean | null>(null);

  // Новые состояния для запросов пользователей
  const [userRequests, setUserRequests] = useState<UserRequest[]>([]);
  const [companyGroups, setCompanyGroups] = useState<CompanyGroup[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [downloadingRequest, setDownloadingRequest] = useState<string | null>(
    null,
  );

  // Автоматическая аутентификация если isAdmin = true
  useEffect(() => {
    if (isAdmin) {
      setIsAuthenticated(true);
    }
  }, [isAdmin]);

  // Функция для загрузки запросов пользователей
  const fetchUserRequests = async () => {
    setRequestsLoading(true);
    try {
      const response = await axios.get<UserRequest[]>(
        `${API_URL}/admin/file-upload-history`,
        {
          headers: user?.token
            ? {
                Authorization: `Bearer ${user.token}`,
              }
            : {},
        },
      );
      setUserRequests(response.data);
    } catch (error) {
      console.error("Ошибка загрузки запросов:", error);
      setUploadMessage("Ошибка при загрузке запросов пользователей");
      setUploadSuccess(false);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Группируем запросы при изменении userRequests
  useEffect(() => {
    if (userRequests.length > 0) {
      setCompanyGroups(groupRequestsByCompany(userRequests));
    } else {
      setCompanyGroups([]);
    }
  }, [userRequests]);

  // Функция для скачивания Excel файла запроса
  const downloadUserRequestExcel = async (request: UserRequest) => {
    setDownloadingRequest(request.inn + request.timestamp);
    try {
      // Преобразуем fileContent в нужный формат для экспорта
      const exportData = (request.fileContent ?? []).map(
        (item: FileContent) => {
          // Ищем штрихкод в разных вариантах написания
          const barcode =
            item.barcode ||
            item.Штрихкод ||
            item["Штрих-код"] ||
            item.barCode ||
            item.code ||
            item.Код ||
            "";

          // Ищем количество
          const quantity =
            item.quantity ||
            item.Количество ||
            item.qty ||
            item["Кол-во"] ||
            item.count ||
            0;

          return {
            Штрихкод: String(barcode).trim(),
            Количество: Number(quantity) || 0,
          };
        },
      );

      // Фильтруем пустые записи
      const filteredData = exportData.filter(
        (item) => item.Штрихкод && item.Количество > 0,
      );

      if (filteredData.length === 0) {
        setUploadMessage("Нет данных для выгрузки");
        setUploadSuccess(false);
        return;
      }

      const response = await axios.post(
        `${API_URL}/data/export-history-to-excel`,
        filteredData,
        {
          responseType: "blob",
          headers: {
            "Content-Type": "application/json",
            ...(user?.token && { Authorization: `Bearer ${user.token}` }),
          },
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      // Создаем имя файла на основе данных пользователя и даты
      const fileName = `request_${request.fullName}_${new Date(request.timestamp).toISOString().split("T")[0]}.xlsx`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setUploadMessage(`Файл запроса ${request.fullName} успешно скачан`);
      setUploadSuccess(true);
    } catch (error: any) {
      console.error("Ошибка скачивания:", error);

      if (error.response?.status === 400) {
        setUploadMessage("Неверный формат данных для экспорта");
      } else if (error.response?.status === 401) {
        setUploadMessage("Ошибка авторизации");
      } else if (error.response?.status === 500) {
        setUploadMessage("Ошибка сервера при создании файла");
      } else {
        setUploadMessage("Ошибка при скачивании файла запроса");
      }
      setUploadSuccess(false);
    } finally {
      setDownloadingRequest(null);
    }
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Переключение раскрытия компании
  const toggleCompanyExpansion = (companyId: string) => {
    setExpandedCompany(expandedCompany === companyId ? null : companyId);
    // Закрываем все запросы при закрытии компании
    if (expandedCompany === companyId) {
      setExpandedRequest(null);
    }
  };

  // Переключение раскрытия запроса
  const toggleRequestExpansion = (requestId: string) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
  };

  // Загружаем запросы при аутентификации
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserRequests();
    }
  }, [isAuthenticated]);

  // Загрузка шаблона таблицы поставщиков
  const downloadSuppliersTemplate = async () => {
    setDownloadTemplateLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/template/download-supplier`,
        {
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "suppliers_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();

      setUploadMessage("Шаблон таблицы поставщиков успешно скачан");
      setUploadSuccess(true);
    } catch (error) {
      console.error("Ошибка загрузки шаблона:", error);
      setUploadMessage("Ошибка при скачивании шаблона");
      setUploadSuccess(false);
    } finally {
      setDownloadTemplateLoading(false);
    }
  };

  // Загрузка данных поставщиков
  const uploadSuppliersData = async () => {
    if (!selectedFile) {
      setUploadMessage("Пожалуйста, выберите файл для загрузки");
      setUploadSuccess(false);
      return;
    }

    setUploadLoading(true);
    setUploadResponse(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await axios.post<UploadResponse>(
        `${API_URL}/data/upload-supplier-data`,
        formData,
        {
          headers: {
            ...(user?.token && { Authorization: `Bearer ${user.token}` }),
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setUploadResponse(response.data);

      if (response.data.success) {
        setUploadMessage("Данные поставщиков успешно загружены");
        setUploadSuccess(true);
      } else {
        setUploadMessage("При загрузке данных возникли ошибки");
        setUploadSuccess(false);
      }

      setSelectedFile(null);

      const fileInput = document.getElementById(
        "suppliers-file-upload",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error: any) {
      console.error("Ошибка при загрузке файла:", error);
      setUploadMessage(
        error.response?.data?.message ||
          "Ошибка при загрузке данных поставщиков",
      );
      setUploadSuccess(false);
    } finally {
      setUploadLoading(false);
    }
  };

  // Обработчик выбора файла
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setUploadMessage("");
    setUploadSuccess(null);
    setUploadResponse(null);
  };

  // Получаем статистику из сообщения
  const stats = uploadResponse
    ? parseStatsFromMessage(uploadResponse.message)
    : null;

  return (
    <div className="from-blue-25 min-h-screen w-screen bg-gradient-to-br to-white">
      {/* Основной контент */}
      <div className="container mx-auto px-4 py-8 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto max-w-6xl"
        >
          {/* Заголовок */}
          <div className="mb-8 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mb-4 text-4xl font-bold text-blue-900 md:text-5xl"
            >
              Панель администратора
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mb-6 text-lg text-blue-700 md:text-xl"
            >
              Управление данными поставщиков и просмотр запросов пользователей
            </motion.p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button onClick={() => navigate("/")}>
                Перейти на главную страницу
              </Button>
            </div>
          </div>

          {/* Карточка загрузки данных */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mb-8 rounded-2xl border border-blue-100 bg-white p-8 shadow-lg shadow-blue-100/30"
          >
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-blue-900">
                Загрузка данных поставщиков
              </h2>
              <p className="mt-2 text-blue-700">
                Загрузите Excel файл с данными поставщиков для обновления базы
                данных
              </p>
            </div>

            {/* Кнопка скачивания шаблона */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    Шаблон таблицы
                  </h3>
                  <p className="text-sm text-blue-600">
                    Скачайте готовый шаблон для заполнения
                  </p>
                </div>
                <Button
                  onClick={downloadSuppliersTemplate}
                  disabled={downloadTemplateLoading}
                  className="flex items-center gap-2"
                >
                  {downloadTemplateLoading ? (
                    <span className="flex items-center">
                      <svg
                        className="mr-2 h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Скачивание...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <DownloadIcon />
                      <span>Скачать шаблон</span>
                    </span>
                  )}
                </Button>
              </div>
            </div>

            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-900">
                Требования к файлу:
              </h3>
              <ul className="list-disc space-y-1 pl-5 text-sm text-blue-700">
                <li>Формат: Excel (.xlsx, .xls)</li>
                <li>
                  Должен содержать колонки: штрих-код, наименование товара,
                  поставщик, цена
                </li>
                <li>Первая строка должна содержать заголовки колонок</li>
                <li>Данные должны быть корректно отформатированы</li>
              </ul>
            </div>

            <div className="mb-4">
              <label
                htmlFor="suppliers-file-upload"
                className="mb-3 flex items-center text-sm font-medium text-blue-700"
              >
                <FileIcon />
                <span className="ml-2">
                  Выберите файл с данными поставщиков:
                </span>
              </label>
              <input
                id="suppliers-file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="block w-full text-sm text-blue-700 transition-colors file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-3 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
              />
            </div>

            {selectedFile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3"
              >
                <p className="flex items-center text-sm text-blue-700">
                  <FileIcon />
                  <span className="ml-2">
                    Выбран файл: <strong>{selectedFile.name}</strong>
                  </span>
                </p>
              </motion.div>
            )}

            <Button
              onClick={uploadSuppliersData}
              disabled={uploadLoading || !selectedFile}
              className="w-full"
            >
              {uploadLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Загрузка...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <FileIcon />
                  <span className="ml-2">Загрузить данные поставщиков</span>
                </span>
              )}
            </Button>
          </motion.div>

          {/* Сообщение о статусе */}
          {uploadMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-8 rounded-xl p-4 ${
                uploadSuccess === true
                  ? "border border-green-200 bg-green-50 text-green-800"
                  : uploadSuccess === false
                    ? "border border-red-200 bg-red-50 text-red-800"
                    : "border border-blue-200 bg-blue-50 text-blue-800"
              }`}
            >
              <div className="flex items-center">
                {uploadSuccess === true ? <SuccessIcon /> : <ErrorIcon />}
                <span className="ml-2 font-medium">{uploadMessage}</span>
              </div>
            </motion.div>
          )}

          {/* Детальный ответ от сервера */}
          {uploadResponse && stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-8 rounded-2xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/30"
            >
              <h3 className="mb-4 text-xl font-semibold text-blue-900">
                Результат обработки
              </h3>

              {/* Основная статистика */}
              <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
                <div className="rounded-lg bg-green-100 p-4 text-center text-green-800">
                  <div className="text-2xl font-bold">{stats.added}</div>
                  <div className="text-sm">Добавлено</div>
                </div>
                <div className="rounded-lg bg-blue-100 p-4 text-center text-blue-800">
                  <div className="text-2xl font-bold">{stats.updated}</div>
                  <div className="text-sm">Обновлено</div>
                </div>
                <div className="rounded-lg bg-gray-100 p-4 text-center text-gray-800">
                  <div className="text-2xl font-bold">{stats.unchanged}</div>
                  <div className="text-sm">Без изменений</div>
                </div>
                <div className="rounded-lg bg-amber-100 p-4 text-center text-amber-800">
                  <div className="text-2xl font-bold">
                    {stats.skippedDuplicates}
                  </div>
                  <div className="text-sm">Пропущено дубликатов</div>
                </div>
                <div
                  className={`rounded-lg p-4 text-center ${
                    stats.errors > 0
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  <div className="text-2xl font-bold">{stats.errors}</div>
                  <div className="text-sm">Ошибок</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Секция запросов пользователей */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="rounded-2xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/30"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-blue-900">
                  Запросы пользователей
                </h2>
                <p className="mt-1 text-blue-600">
                  История всех запросов на анализ цен от пользователей
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-blue-600">
                  Всего компаний: {companyGroups.length}
                </div>
                <Button
                  onClick={fetchUserRequests}
                  disabled={requestsLoading}
                  className="flex items-center gap-2"
                >
                  {requestsLoading ? (
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : null}
                  Обновить
                </Button>
              </div>
            </div>

            {requestsLoading ? (
              <div className="flex justify-center py-8">
                <div className="text-blue-600">Загрузка запросов...</div>
              </div>
            ) : companyGroups.length === 0 ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-8 text-center">
                <p className="text-blue-700">
                  Запросы пользователей не найдены
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {companyGroups.map((company, companyIndex) => {
                  const companyId = `${company.inn}_${company.fullName}`;
                  const isCompanyExpanded = expandedCompany === companyId;

                  return (
                    <motion.div
                      key={companyId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: companyIndex * 0.1 }}
                      className="overflow-hidden rounded-lg border border-blue-200 bg-white"
                    >
                      {/* Заголовок компании */}
                      <div
                        className="flex cursor-pointer items-center justify-between p-4 hover:bg-blue-50"
                        onClick={() => toggleCompanyExpansion(companyId)}
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`transform transition-transform ${isCompanyExpanded ? "rotate-180" : ""}`}
                          >
                            <ChevronDownIcon />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-blue-900">
                              {company.fullName}
                            </h3>
                            <p className="text-sm text-blue-600">
                              ИНН: {company.inn} • Телефон: {company.phone} •
                              Запросов: {company.requests.length}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-blue-600">
                            {company.requests.length} запросов
                          </span>
                        </div>
                      </div>

                      {/* Раскрывающееся содержимое компании */}
                      <AnimatePresence>
                        {isCompanyExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-blue-200 bg-blue-50"
                          >
                            <div className="p-4">
                              <div className="space-y-3">
                                {company.requests.map(
                                  (request, requestIndex) => {
                                    const requestId = `${request.inn}_${request.timestamp}`;
                                    const isRequestExpanded =
                                      expandedRequest === requestId;
                                    const isDownloading =
                                      downloadingRequest === requestId;

                                    return (
                                      <motion.div
                                        key={requestId}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                          delay: requestIndex * 0.05,
                                        }}
                                        className="overflow-hidden rounded-lg border border-blue-200 bg-white"
                                      >
                                        {/* Заголовок запроса */}
                                        <div
                                          className="flex cursor-pointer items-center justify-between p-3 hover:bg-blue-50"
                                          onClick={() =>
                                            toggleRequestExpansion(requestId)
                                          }
                                        >
                                          <div className="flex items-center space-x-3">
                                            <div
                                              className={`transform transition-transform ${isRequestExpanded ? "rotate-180" : ""}`}
                                            >
                                              <ChevronDownIcon />
                                            </div>
                                            <div>
                                              <h4 className="font-medium text-blue-900">
                                                Запрос от{" "}
                                                {formatDate(request.timestamp)}
                                              </h4>
                                              <p className="text-xs text-blue-600">
                                                Товаров:{" "}
                                                {request.fileContent?.length ??
                                                  0}
                                              </p>
                                            </div>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                downloadUserRequestExcel(
                                                  request,
                                                );
                                              }}
                                              disabled={isDownloading}
                                              className="flex items-center gap-1 text-sm"
                                            >
                                              {isDownloading ? (
                                                <svg
                                                  className="h-3 w-3 animate-spin"
                                                  fill="none"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                  ></circle>
                                                  <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                  ></path>
                                                </svg>
                                              ) : (
                                                <ExportIcon />
                                              )}
                                              Excel
                                            </Button>
                                          </div>
                                        </div>

                                        {/* Раскрывающееся содержимое запроса */}
                                        <AnimatePresence>
                                          {isRequestExpanded && (
                                            <motion.div
                                              initial={{
                                                height: 0,
                                                opacity: 0,
                                              }}
                                              animate={{
                                                height: "auto",
                                                opacity: 1,
                                              }}
                                              exit={{ height: 0, opacity: 0 }}
                                              transition={{ duration: 0.2 }}
                                              className="border-t border-blue-200"
                                            >
                                              <div className="p-3">
                                                <div>
                                                  <h5 className="mb-2 font-semibold text-blue-900">
                                                    Содержимое запроса (
                                                    {request.fileContent
                                                      ?.length ?? 0}{" "}
                                                    товаров)
                                                  </h5>
                                                  <div className="max-h-60 overflow-y-auto rounded-lg border border-blue-200">
                                                    <table className="w-full text-sm">
                                                      <thead>
                                                        <tr className="bg-blue-50">
                                                          <th className="px-3 py-2 text-left font-semibold text-blue-900">
                                                            Поле
                                                          </th>
                                                          <th className="px-3 py-2 text-left font-semibold text-blue-900">
                                                            Значение
                                                          </th>
                                                        </tr>
                                                      </thead>
                                                      <tbody>
                                                        {request.fileContent?.map(
                                                          (item, itemIndex) => (
                                                            <>
                                                              {Object.entries(
                                                                item,
                                                              ).map(
                                                                ([
                                                                  key,
                                                                  value,
                                                                ]) => (
                                                                  <tr
                                                                    key={key}
                                                                    className="border-b border-blue-100 last:border-b-0"
                                                                  >
                                                                    <td className="px-3 py-2 font-medium text-blue-900">
                                                                      {key}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-blue-700">
                                                                      {typeof value ===
                                                                      "object"
                                                                        ? JSON.stringify(
                                                                            value,
                                                                          )
                                                                        : String(
                                                                            value,
                                                                          )}
                                                                    </td>
                                                                  </tr>
                                                                ),
                                                              )}
                                                              {itemIndex <
                                                                (request
                                                                  .fileContent
                                                                  ?.length ??
                                                                  0) -
                                                                  1 && (
                                                                <tr>
                                                                  <td
                                                                    colSpan={2}
                                                                    className="border-b border-blue-300"
                                                                  ></td>
                                                                </tr>
                                                              )}
                                                            </>
                                                          ),
                                                        )}
                                                      </tbody>
                                                    </table>
                                                  </div>
                                                </div>
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </motion.div>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default Admin;
