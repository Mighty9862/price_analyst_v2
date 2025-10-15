import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import Button from "./components/ui/Button";
import SuccessIcon from "./components/ui/icons/SuccessIcon";
import ErrorIcon from "./components/ui/icons/ErrorIcon";
import ExportIcon from "./components/ui/icons/ExportIcon";
import ChevronDownIcon from "./components/ui/icons/ChevronDownIcon";
import { useAtom } from "jotai";
import { userAtom } from "@/store/authStore";
import { useNavigate } from "react-router-dom";

interface RequestResponse {
  barcode: string;
  quantity: number;
  productName: string | null;
  supplierName: string | null;
  unitPrice: number | null;
  totalPrice: number | null;
  requiresManualProcessing: boolean;
  message: string;
}

interface UserRequest {
  id: number;
  timestamp: string;
  requestDetails: string;
  responseDetails: RequestResponse[];
}

interface SupplierInfo {
  name: string;
  inn: string;
  address: string;
  phone: string;
  email: string;
}

// Функция для парсинга информации о поставщике из строки
const parseSupplierInfo = (
  supplierString: string | null,
): SupplierInfo | null => {
  if (!supplierString) return null;

  try {
    // Разделяем строку по запятым
    const parts = supplierString.split(",").map((part) => part.trim());

    if (parts.length >= 3) {
      return {
        name: parts[0], // Название организации
        inn: parts[1], // ИНН
        address: parts.slice(2, -2).join(", "), // Адрес (все части кроме первых двух и последних двух)
        phone: parts[parts.length - 2] || "", // Телефон (предпоследний элемент)
        email: parts[parts.length - 1] || "", // Email (последний элемент)
      };
    }

    // Если формат не соответствует ожидаемому, возвращаем исходную строку
    return {
      name: supplierString,
      inn: "",
      address: "",
      phone: "",
      email: "",
    };
  } catch (error) {
    console.error("Ошибка парсинга информации о поставщике:", error);
    return {
      name: supplierString,
      inn: "",
      address: "",
      phone: "",
      email: "",
    };
  }
};

function Profile() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [user] = useAtom(userAtom);
  const navigate = useNavigate();

  const [userRequests, setUserRequests] = useState<UserRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState<number | null>(null);
  const [downloadingRequest, setDownloadingRequest] = useState<number | null>(
    null,
  );
  const [message, setMessage] = useState<string>("");
  const [messageSuccess, setMessageSuccess] = useState<boolean | null>(null);

  // Функция для загрузки запросов пользователя
  const fetchUserRequests = async () => {
    setRequestsLoading(true);
    try {
      const response = await axios.get<UserRequest[]>(
        `${API_URL}/profile/history`,
        {
          headers: {
            Authorization: `Bearer ${user?.token || ""}`,
          },
        },
      );
      setUserRequests(response.data);
      setMessage(`Загружено ${response.data.length} запросов`);
      setMessageSuccess(true);
    } catch (error: any) {
      console.error("Ошибка загрузки запросов:", error);
      if (error.response?.status === 401) {
        setMessage("Сессия истекла. Пожалуйста, войдите снова.");
        setMessageSuccess(false);
        navigate("/login");
      } else {
        setMessage(
          error.response?.data?.message ||
            "Ошибка при загрузке истории запросов",
        );
        setMessageSuccess(false);
      }
    } finally {
      setRequestsLoading(false);
    }
  };

  // Функция для скачивания Excel файла запроса
  const downloadRequestExcel = async (request: UserRequest) => {
    if (!user?.token) {
      setMessage("Ошибка авторизации");
      setMessageSuccess(false);
      return;
    }

    setDownloadingRequest(request.id);
    try {
      // Преобразуем responseDetails в правильный формат для экспорта
      const exportData = request.responseDetails.map((item) => ({
        barcode: item.barcode,
        quantity: item.quantity,
        productName: item.productName || "",
        supplierName: item.supplierName || "",
        unitPrice: item.unitPrice || 0,
        totalPrice: item.totalPrice || 0,
        requiresManualProcessing: item.requiresManualProcessing,
        message: item.message,
      }));

      const response = await axios.post(
        `${API_URL}/data/export-analysis`,
        exportData,
        {
          responseType: "blob",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const fileName = `запрос_${new Date(request.timestamp).toISOString().split("T")[0]}.xlsx`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setMessage(
        `Файл запроса от ${formatDate(request.timestamp)} успешно скачан`,
      );
      setMessageSuccess(true);
    } catch (error: any) {
      console.error("Ошибка скачивания:", error);

      if (error.response?.status === 400) {
        setMessage("Неверный формат данных для экспорта");
      } else if (error.response?.status === 401) {
        setMessage("Ошибка авторизации");
      } else if (error.response?.status === 500) {
        setMessage("Ошибка сервера при создании файла");
      } else {
        setMessage("Ошибка при скачивании файла запроса");
      }
      setMessageSuccess(false);
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

  // Форматирование цены
  const formatPrice = (price: number | null) => {
    if (price === null) return "-";
    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Переключение раскрытия запроса
  const toggleRequestExpansion = (requestId: number) => {
    setExpandedRequest(expandedRequest === requestId ? null : requestId);
  };

  // Загружаем запросы при монтировании компонента
  useEffect(() => {
    fetchUserRequests();
  }, []);

  // Статистика по запросу
  const getRequestStats = (request: UserRequest) => {
    const totalItems = request.responseDetails.length;
    const foundItems = request.responseDetails.filter(
      (item) => !item.requiresManualProcessing,
    ).length;
    const manualItems = request.responseDetails.filter(
      (item) => item.requiresManualProcessing,
    ).length;
    const totalPrice = request.responseDetails
      .filter((item) => item.totalPrice)
      .reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    return { totalItems, foundItems, manualItems, totalPrice };
  };

  // Получение топ-3 поставщиков с полной информацией
  const getTopSuppliersWithInfo = (request: UserRequest) => {
    const supplierMap = new Map<
      string,
      { count: number; info: SupplierInfo | null }
    >();

    // Собираем информацию о поставщиках
    request.responseDetails.forEach((item) => {
      if (item.supplierName && !item.requiresManualProcessing) {
        const supplierInfo = parseSupplierInfo(item.supplierName);
        const supplierKey = supplierInfo
          ? supplierInfo.name
          : item.supplierName;

        if (supplierMap.has(supplierKey)) {
          supplierMap.get(supplierKey)!.count += 1;
        } else {
          supplierMap.set(supplierKey, {
            count: 1,
            info: supplierInfo,
          });
        }
      }
    });

    // Сортируем поставщиков по количеству товаров (по убыванию) и берем топ-3
    const sortedSuppliers = Array.from(supplierMap.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 3);

    return sortedSuppliers;
  };

  // Получение общей стоимости по поставщику
  const getSupplierTotalPrice = (
    request: UserRequest,
    supplierName: string,
  ) => {
    return request.responseDetails
      .filter((item) => {
        const supplierInfo = parseSupplierInfo(item.supplierName);
        const itemSupplierName = supplierInfo
          ? supplierInfo.name
          : item.supplierName;
        return (
          itemSupplierName === supplierName && !item.requiresManualProcessing
        );
      })
      .reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  };

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
              Личный кабинет
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mb-6 text-lg text-blue-700 md:text-xl"
            >
              История ваших запросов на анализ цен
            </motion.p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button onClick={() => navigate("/")}>
                Перейти на главную страницу
              </Button>
            </div>
          </div>

          {/* Сообщение о статусе */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-8 rounded-xl p-4 ${
                messageSuccess === true
                  ? "border border-green-200 bg-green-50 text-green-800"
                  : messageSuccess === false
                    ? "border border-red-200 bg-red-50 text-red-800"
                    : "border border-blue-200 bg-blue-50 text-blue-800"
              }`}
            >
              <div className="flex items-center">
                {messageSuccess === true ? <SuccessIcon /> : <ErrorIcon />}
                <span className="ml-2 font-medium">{message}</span>
              </div>
            </motion.div>
          )}

          {/* Секция истории запросов */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="rounded-2xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/30"
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-blue-900">
                  История запросов
                </h2>
                <p className="mt-1 text-blue-600">
                  Все ваши запросы на анализ цен и их результаты
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-blue-600">
                  Всего запросов: {userRequests.length}
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
            ) : userRequests.length === 0 ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-8 text-center">
                <p className="text-blue-700">У вас пока нет запросов</p>
                <Button onClick={() => navigate("/")} className="mt-4">
                  Сделать первый запрос
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {userRequests.map((request, index) => {
                  const isExpanded = expandedRequest === request.id;
                  const isDownloading = downloadingRequest === request.id;
                  const stats = getRequestStats(request);
                  const topSuppliers = getTopSuppliersWithInfo(request);

                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="overflow-hidden rounded-lg border border-blue-200 bg-white"
                    >
                      {/* Заголовок запроса */}
                      <div
                        className="flex cursor-pointer items-center justify-between p-4 hover:bg-blue-50"
                        onClick={() => toggleRequestExpansion(request.id)}
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className={`transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          >
                            <ChevronDownIcon />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-blue-900">
                              {request.requestDetails}
                            </h3>
                            <p className="text-sm text-blue-600">
                              {formatDate(request.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          {/* Статистика */}
                          <div className="hidden items-center space-x-3 text-sm sm:flex">
                            <div className="text-green-600">
                              Найдено: {stats.foundItems}
                            </div>
                            <div className="text-amber-600">
                              Обработка: {stats.manualItems}
                            </div>
                            <div className="text-blue-600">
                              Всего: {stats.totalItems}
                            </div>
                            {stats.totalPrice > 0 && (
                              <div className="font-semibold text-green-700">
                                Сумма: {formatPrice(stats.totalPrice)} ₽
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadRequestExcel(request);
                            }}
                            disabled={isDownloading}
                            className="flex items-center gap-2"
                          >
                            {isDownloading ? (
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
                            ) : (
                              <ExportIcon />
                            )}
                            Excel
                          </Button>
                        </div>
                      </div>

                      {/* Мобильная статистика */}
                      <div className="border-t border-blue-200 px-4 py-2 sm:hidden">
                        <div className="flex justify-between text-sm">
                          <div className="text-green-600">
                            Найдено: {stats.foundItems}
                          </div>
                          <div className="text-amber-600">
                            Обработка: {stats.manualItems}
                          </div>
                          <div className="text-blue-600">
                            Всего: {stats.totalItems}
                          </div>
                        </div>
                        {stats.totalPrice > 0 && (
                          <div className="mt-1 text-center font-semibold text-green-700">
                            Общая сумма: {formatPrice(stats.totalPrice)} ₽
                          </div>
                        )}
                      </div>

                      {/* Раскрывающееся содержимое */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="border-t border-blue-200"
                          >
                            <div className="p-4">
                              {/* Топ поставщиков с полной информацией */}
                              {topSuppliers.length > 0 && (
                                <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
                                  <h4 className="mb-4 text-lg font-semibold text-blue-900">
                                    Наиболее подходящие поставщики:
                                  </h4>
                                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    {topSuppliers.map(
                                      (
                                        [supplierName, { count, info }],
                                        supplierIndex,
                                      ) => {
                                        const supplierTotalPrice =
                                          getSupplierTotalPrice(
                                            request,
                                            supplierName,
                                          );
                                        return (
                                          <motion.div
                                            key={supplierName}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                              delay: supplierIndex * 0.1,
                                            }}
                                            className="rounded-lg border border-blue-200 bg-white p-4"
                                          >
                                            <div className="mb-3 text-center">
                                              <div className="text-2xl font-bold text-blue-900">
                                                #{supplierIndex + 1}
                                              </div>
                                              <div className="text-lg font-semibold text-blue-800">
                                                {supplierName}
                                              </div>
                                              <div className="text-sm text-blue-600">
                                                {count} товар
                                                {count === 1
                                                  ? ""
                                                  : count > 1 && count < 5
                                                    ? "а"
                                                    : "ов"}
                                              </div>
                                              {supplierTotalPrice > 0 && (
                                                <div className="mt-1 text-lg font-semibold text-green-700">
                                                  {formatPrice(
                                                    supplierTotalPrice,
                                                  )}{" "}
                                                  ₽
                                                </div>
                                              )}
                                            </div>

                                            {/* Детальная информация о поставщике */}
                                            {info && (
                                              <div className="border-t border-blue-200 pt-3 text-sm">
                                                {info.inn && (
                                                  <div className="mb-1">
                                                    <span className="font-semibold">
                                                      ИНН:
                                                    </span>{" "}
                                                    {info.inn}
                                                  </div>
                                                )}
                                                {info.address && (
                                                  <div className="mb-1">
                                                    <span className="font-semibold">
                                                      Адрес:
                                                    </span>{" "}
                                                    <span className="break-words">
                                                      {info.address}
                                                    </span>
                                                  </div>
                                                )}
                                                {info.phone && (
                                                  <div className="mb-1">
                                                    <span className="font-semibold">
                                                      Телефон:
                                                    </span>{" "}
                                                    {info.phone}
                                                  </div>
                                                )}
                                                {info.email && (
                                                  <div className="mb-1">
                                                    <span className="font-semibold">
                                                      Почта/доп. тел.:
                                                    </span>{" "}
                                                    <a
                                                      href={`mailto:${info.email}`}
                                                      className="break-all text-blue-600 hover:text-blue-800"
                                                    >
                                                      {info.email}
                                                    </a>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </motion.div>
                                        );
                                      },
                                    )}
                                  </div>
                                </div>
                              )}

                              <h4 className="mb-4 font-semibold text-blue-900">
                                Результаты анализа (
                                {request.responseDetails.length} товаров)
                              </h4>

                              {/* Таблица с прокруткой если больше 5 строк */}
                              <div
                                className={`overflow-x-auto ${
                                  request.responseDetails.length > 5
                                    ? "max-h-80 overflow-y-auto"
                                    : ""
                                }`}
                              >
                                <table className="w-full text-sm">
                                  <thead className="sticky top-0 bg-blue-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left font-semibold text-blue-900">
                                        Штрихкод
                                      </th>
                                      <th className="px-3 py-2 text-left font-semibold text-blue-900">
                                        Наименование
                                      </th>
                                      <th className="px-3 py-2 text-left font-semibold text-blue-900">
                                        Кол-во
                                      </th>
                                      <th className="px-3 py-2 text-left font-semibold text-blue-900">
                                        Поставщик
                                      </th>
                                      <th className="px-3 py-2 text-left font-semibold text-blue-900">
                                        Цена
                                      </th>
                                      <th className="px-3 py-2 text-left font-semibold text-blue-900">
                                        Сумма
                                      </th>
                                      <th className="px-3 py-2 text-left font-semibold text-blue-900">
                                        Статус
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {request.responseDetails.map(
                                      (item, itemIndex) => {
                                        const supplierInfo = parseSupplierInfo(
                                          item.supplierName,
                                        );
                                        return (
                                          <tr
                                            key={itemIndex}
                                            className={`border-b border-blue-100 ${
                                              item.requiresManualProcessing
                                                ? "bg-amber-50"
                                                : "bg-white"
                                            }`}
                                          >
                                            <td className="px-3 py-2 font-mono text-blue-900">
                                              {item.barcode}
                                            </td>
                                            <td className="px-3 py-2 text-blue-700">
                                              {item.productName || "Не найдено"}
                                            </td>
                                            <td className="px-3 py-2 text-center text-blue-700">
                                              {item.quantity}
                                            </td>
                                            <td className="px-3 py-2 text-blue-700">
                                              {supplierInfo ? (
                                                <div className="text-sm">
                                                  <div className="font-semibold">
                                                    {supplierInfo.name}
                                                  </div>
                                                </div>
                                              ) : (
                                                item.supplierName || "-"
                                              )}
                                            </td>
                                            <td className="px-3 py-2 text-right text-blue-700">
                                              {formatPrice(item.unitPrice)}
                                            </td>
                                            <td className="px-3 py-2 text-right text-blue-700">
                                              {formatPrice(item.totalPrice)}
                                            </td>
                                            <td className="px-3 py-2">
                                              <span
                                                className={`inline-flex items-center rounded-full px-2 py-1 text-sm font-medium ${
                                                  item.requiresManualProcessing
                                                    ? "bg-amber-100 text-amber-800"
                                                    : "bg-green-100 text-green-800"
                                                }`}
                                              >
                                                {item.requiresManualProcessing
                                                  ? "Обработка"
                                                  : "Найден"}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      },
                                    )}
                                  </tbody>
                                </table>
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

export default Profile;
