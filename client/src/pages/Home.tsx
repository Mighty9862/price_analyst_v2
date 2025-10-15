import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Button from "./components/ui/Button";
import Footer from "./components/layout/Footer";
import DownloadIcon from "./components/ui/icons/DownloadIcon";
import AnalysisIcon from "./components/ui/icons/AnalysisIcon";
import FileIcon from "./components/ui/icons/FileIcon";
import SuccessIcon from "./components/ui/icons/SuccessIcon";
import ExportIcon from "./components/ui/icons/ExportIcon";
import { useAtom } from "jotai";
import { userAtom } from "@/store/authStore";
import AuthModal from "./components/auth/AuthModal";
import Navbar from "./components/layout/Navbar";

interface PriceAnalysisResult {
  barcode: string;
  quantity: number;
  productName: string | null;
  supplierName: string | null;
  unitPrice: number | null;
  totalPrice: number | null;
  requiresManualProcessing: boolean;
  message: string;
}

interface SupplierInfo {
  name: string;
  inn: string;
  address: string;
  phone: string;
  email: string;
}

// Улучшенная функция для парсинга информации о поставщике из строки
const parseSupplierInfo = (
  supplierString: string | null,
): SupplierInfo | null => {
  if (!supplierString) return null;

  try {
    // Разделяем строку по запятым
    const parts = supplierString.split(",").map((part) => part.trim());

    if (parts.length === 0) return null;

    // Базовые поля
    let name = parts[0];
    let inn = "";
    let address = "";
    let phone = "";
    let email = "";

    // Ищем ИНН (обычно второй элемент, состоит из 10 или 12 цифр)
    if (parts.length > 1 && /^\d{10,12}$/.test(parts[1])) {
      inn = parts[1];
    }

    // Ищем email (последний элемент, содержит @)
    const emailIndex = parts.findIndex((part) => part.includes("@"));
    if (emailIndex !== -1) {
      email = parts[emailIndex];
    }

    // Ищем телефоны (содержат цифры, скобки, дефисы)
    const phonePattern = /^[78]\s?\(\d{3}\)\s?\d{3}[- ]?\d{2}[- ]?\d{2}$/;
    const phones = parts.filter((part) => phonePattern.test(part));

    if (phones.length > 0) {
      // Объединяем все телефоны через запятую
      phone = phones.join(", ");
    }

    // Адрес - все что между ИНН и телефонами/email
    let addressStartIndex = inn ? 2 : 1;
    let addressEndIndex = emailIndex !== -1 ? emailIndex : parts.length;

    // Если нашли телефоны, корректируем конец адреса
    if (phones.length > 0) {
      const firstPhoneIndex = parts.findIndex((part) =>
        phonePattern.test(part),
      );
      addressEndIndex = Math.min(addressEndIndex, firstPhoneIndex);
    }

    if (addressEndIndex > addressStartIndex) {
      address = parts.slice(addressStartIndex, addressEndIndex).join(", ");
    }

    return {
      name,
      inn,
      address,
      phone,
      email,
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

// Функция для группировки товаров по поставщикам
const groupProductsBySupplier = (results: PriceAnalysisResult[]) => {
  const supplierMap = new Map<string, PriceAnalysisResult[]>();

  results.forEach((item) => {
    if (!item.requiresManualProcessing && item.supplierName) {
      const supplierInfo = parseSupplierInfo(item.supplierName);
      const supplierKey = supplierInfo ? supplierInfo.name : item.supplierName;

      if (supplierMap.has(supplierKey)) {
        supplierMap.get(supplierKey)!.push(item);
      } else {
        supplierMap.set(supplierKey, [item]);
      }
    }
  });

  return Array.from(supplierMap.entries()).map(([supplierName, products]) => {
    const firstProduct = products[0];
    const supplierInfo = parseSupplierInfo(firstProduct.supplierName);

    return {
      supplierName,
      supplierInfo,
      products,
      totalCost: products.reduce(
        (sum, product) => sum + (product.totalPrice || 0),
        0,
      ),
      productCount: products.length,
    };
  });
};

// Функция для получения товаров, требующих ручной обработки
const getManualProcessingProducts = (results: PriceAnalysisResult[]) => {
  return results.filter((item) => item.requiresManualProcessing);
};

function Home() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string>("");
  const [uploadSuccess, setUploadSuccess] = useState<boolean | null>(null);
  const [analysisResults, setAnalysisResults] = useState<PriceAnalysisResult[]>(
    [],
  );
  const [showResults, setShowResults] = useState(false);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user] = useAtom(userAtom);

  // Проверяем авторизацию при загрузке
  useEffect(() => {
    if (user?.token) {
      console.log("Пользователь авторизован:", user);
    }
  }, [user]);

  // Функция для скачивания шаблона таблицы
  const downloadTemplate = async () => {
    setDownloadLoading(true);
    try {
      const response = await axios.get(`${API_URL}/template/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();

      setUploadMessage("Шаблон успешно скачан");
      setUploadSuccess(true);
    } catch (error) {
      console.error("Ошибка загрузки:", error);
      setUploadMessage("Ошибка при скачивании шаблона");
      setUploadSuccess(false);
    } finally {
      setDownloadLoading(false);
    }
  };

  // Функция для загрузки заполненной таблицы
  const uploadTable = async () => {
    if (!selectedFile) {
      setUploadMessage("Пожалуйста, выберите файл для загрузки");
      setUploadSuccess(false);
      return;
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await axios.post<PriceAnalysisResult[]>(
        `${API_URL}/data/analyze-prices`,
        formData,
        {
          headers: {
            ...(user?.token && { Authorization: `Bearer ${user.token}` }),
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setUploadMessage("Анализ цен завершен успешно");
      setUploadSuccess(true);

      if (response.data) {
        setAnalysisResults(response.data);
        setShowResults(true);
      }

      setSelectedFile(null);

      // Сбрасываем input file
      const fileInput = document.getElementById(
        "file-upload",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error: any) {
      console.error("Ошибка при загрузке файла:", error);
      setUploadMessage(
        error.response?.data?.message || "Ошибка при анализе файла",
      );
      setUploadSuccess(false);
      setShowResults(false);
    } finally {
      setUploadLoading(false);
    }
  };

  const exportResultsToExcel = async () => {
    if (analysisResults.length === 0) {
      setUploadMessage("Нет данных для выгрузки");
      setUploadSuccess(false);
      return;
    }

    setExportLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/data/export-analysis`,
        analysisResults,
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
      link.setAttribute("download", "analysis_results.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();

      setUploadMessage("Результаты успешно выгружены в Excel");
      setUploadSuccess(true);
    } catch (error) {
      console.error("Ошибка выгрузки:", error);
      setUploadMessage("Ошибка при выгрузке результатов");
      setUploadSuccess(false);
    } finally {
      setExportLoading(false);
    }
  };

  // Обработчик выбора файла
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setUploadMessage("");
    setUploadSuccess(null);
    setShowResults(false);
  };

  // Форматирование цены
  const formatPrice = (price: number | null) => {
    if (price === null) return "—";
    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Расчет общего количества найденных товаров
  const getTotalFoundQuantity = () => {
    return analysisResults.filter((item) => !item.requiresManualProcessing)
      .length;
  };

  // Расчет общей стоимости
  const getTotalCost = () => {
    return analysisResults.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0,
    );
  };

  // Получение количества товаров, требующих ручной обработки
  const getManualProcessingCount = () => {
    return analysisResults.filter((item) => item.requiresManualProcessing)
      .length;
  };

  // Получение топ-3 поставщиков с полной информацией
  const getTopSuppliersWithInfo = () => {
    const supplierMap = new Map<
      string,
      { count: number; info: SupplierInfo | null }
    >();

    // Собираем информацию о поставщиках
    analysisResults.forEach((item) => {
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
  const getSupplierTotalPrice = (supplierName: string) => {
    return analysisResults
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
      <Navbar setIsAuthModalOpen={setIsAuthModalOpen} />

      {/* Основной контент */}
      <div className="relative z-10 pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mx-auto max-w-6xl"
          >
            {/* Заголовок */}
            <div className="mb-16 text-center">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="mb-4 text-4xl font-bold text-blue-900 md:text-5xl"
              >
                Анализ цен поставщиков
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="mx-auto max-w-2xl text-lg text-blue-700 md:text-xl"
              >
                Получите лучшие цены на товары от проверенных поставщиков в
                несколько кликов
              </motion.p>
            </div>

            {/* Карточки действий */}
            <div className="mb-16 grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Карточка скачивания шаблона */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="group relative rounded-2xl border border-blue-100 bg-white p-8 shadow-lg shadow-blue-100/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-100/50"
              >
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <DownloadIcon />
                </div>
                <h3 className="mb-4 text-2xl font-semibold text-blue-900">
                  Скачать шаблон
                </h3>
                <p className="mb-6 leading-relaxed text-blue-700">
                  Получите готовый шаблон Excel таблицы для заполнения данными о
                  товарах. Простая структура для быстрого заполнения.
                </p>
                <Button
                  onClick={downloadTemplate}
                  disabled={downloadLoading}
                  className="w-full"
                >
                  {downloadLoading ? (
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
                      Скачивание...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <DownloadIcon />
                      <span className="ml-2">Скачать шаблон</span>
                    </span>
                  )}
                </Button>
              </motion.div>

              {/* Карточка загрузки таблицы */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="group relative rounded-2xl border border-blue-100 bg-white p-8 shadow-lg shadow-blue-100/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-100/50"
              >
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <AnalysisIcon />
                </div>
                <h3 className="mb-4 text-2xl font-semibold text-blue-900">
                  Анализ цен
                </h3>
                <p className="mb-6 leading-relaxed text-blue-700">
                  Загрузите заполненную таблицу для автоматического анализа.
                  Система найдет поставщиков с лучшими ценами для каждого
                  товара.
                </p>

                <div className="mb-4">
                  <label
                    htmlFor="file-upload"
                    className="text-md mb-3 flex items-center font-medium text-blue-700"
                  >
                    <FileIcon />
                    <span className="ml-2">Выберите файл для анализа:</span>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="text-md file:text-md block w-full text-blue-700 transition-colors file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-3 file:font-medium file:text-white hover:file:bg-blue-700"
                  />
                </div>

                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3"
                  >
                    <p className="text-md flex items-center text-blue-700">
                      <FileIcon />
                      <span className="ml-2">
                        Выбран файл: <strong>{selectedFile.name}</strong>
                      </span>
                    </p>
                  </motion.div>
                )}

                <Button
                  onClick={uploadTable}
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
                      Анализ...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <AnalysisIcon />
                      <span className="ml-2">Проанализировать цены</span>
                    </span>
                  )}
                </Button>
              </motion.div>
            </div>

            {/* Сообщение о статусе */}
            {uploadMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 rounded-xl p-4 text-center ${
                  uploadSuccess === true
                    ? "border border-green-200 bg-green-50 text-green-800"
                    : uploadSuccess === false
                      ? "border border-red-200 bg-red-50 text-red-800"
                      : "border border-blue-200 bg-blue-50 text-blue-800"
                }`}
              >
                {uploadSuccess === true && (
                  <div className="flex items-center justify-center">
                    <SuccessIcon />
                    <span className="ml-2 font-medium">{uploadMessage}</span>
                  </div>
                )}
                {uploadSuccess !== true && (
                  <span className="font-medium">{uploadMessage}</span>
                )}
              </motion.div>
            )}

            {/* Результаты анализа */}
            {showResults && analysisResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="mt-8 rounded-2xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/30"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-semibold text-blue-900">
                      Результаты анализа
                    </h3>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={exportResultsToExcel}
                      disabled={exportLoading}
                      className="flex items-center gap-2"
                    >
                      {exportLoading ? (
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
                          Выгрузка...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <ExportIcon />
                          <span>Выгрузить в Excel</span>
                        </span>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Топ поставщиков с полной информацией */}
                {getTopSuppliersWithInfo().length > 0 && (
                  <div className="mb-6">
                    <h4 className="mb-4 text-lg font-semibold text-blue-900">
                      Наиболее подходящие поставщики:
                    </h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {getTopSuppliersWithInfo().map(
                        ([supplierName, { count, info }], index) => {
                          const supplierTotalPrice =
                            getSupplierTotalPrice(supplierName);
                          return (
                            <motion.div
                              key={supplierName}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="rounded-lg border border-blue-200 bg-white p-4"
                            >
                              <div className="mb-3 text-center">
                                <div className="text-2xl font-bold text-blue-900">
                                  #{index + 1}
                                </div>
                                <div className="text-xl font-semibold text-blue-800">
                                  {supplierName}
                                </div>
                                <div className="text-md text-blue-600">
                                  {count} товар
                                  {count === 1
                                    ? ""
                                    : count > 1 && count < 5
                                      ? "а"
                                      : "ов"}
                                </div>
                                {supplierTotalPrice > 0 && (
                                  <div className="mt-1 text-lg font-semibold text-green-700">
                                    {formatPrice(supplierTotalPrice)} ₽
                                  </div>
                                )}
                              </div>

                              {/* Детальная информация о поставщике */}
                              {info && (
                                <div className="text-md border-t border-blue-200 pt-3">
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
                                        Телефоны:
                                      </span>{" "}
                                      {info.phone
                                        .split(", ")
                                        .map((phone, idx) => (
                                          <div key={idx} className="text-md">
                                            {phone}
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                  {info.email && (
                                    <div className="mb-1">
                                      <span className="font-semibold">
                                        Email:
                                      </span>{" "}
                                      {info.email}
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

                {/* Построчное разделение поставщиков с их товарами */}
                {groupProductsBySupplier(analysisResults).length > 0 && (
                  <div className="mb-6">
                    <h4 className="mb-4 text-lg font-semibold text-blue-900">
                      Товары по поставщикам:
                    </h4>

                    {groupProductsBySupplier(analysisResults).map(
                      (supplierGroup, supplierIndex) => (
                        <motion.div
                          key={supplierGroup.supplierName}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: supplierIndex * 0.1 }}
                          className="mb-8 rounded-lg border border-blue-200 bg-white"
                        >
                          {/* Заголовок поставщика */}
                          <div className="border-b border-blue-200 bg-blue-50 p-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                              <div className="mb-2 md:mb-0">
                                <h5 className="text-lg font-semibold text-blue-900">
                                  {supplierGroup.supplierName}
                                </h5>
                                {supplierGroup.supplierInfo && (
                                  <div className="text-md mt-1 text-blue-700">
                                    {supplierGroup.supplierInfo.inn && (
                                      <span className="mr-4">
                                        <strong>ИНН:</strong>{" "}
                                        {supplierGroup.supplierInfo.inn}
                                      </span>
                                    )}
                                    {supplierGroup.supplierInfo.phone && (
                                      <div className="mt-1">
                                        <strong>Телефоны:</strong>{" "}
                                        {supplierGroup.supplierInfo.phone
                                          .split(", ")
                                          .map((phone, idx) => (
                                            <span key={idx} className="mr-2">
                                              {phone}
                                            </span>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="text-lg text-blue-700">
                                <div className="font-semibold">
                                  Всего товаров: {supplierGroup.productCount}
                                </div>
                                <div className="font-semibold text-green-700">
                                  Общая стоимость:{" "}
                                  {formatPrice(supplierGroup.totalCost)} ₽
                                </div>
                              </div>
                            </div>
                            {supplierGroup.supplierInfo?.address && (
                              <div className="text-md mt-2 text-blue-600">
                                <strong>Адрес:</strong>{" "}
                                {supplierGroup.supplierInfo.address}
                              </div>
                            )}
                            {supplierGroup.supplierInfo?.email && (
                              <div className="text-md mt-1 text-blue-600">
                                <strong>Email:</strong>{" "}
                                {supplierGroup.supplierInfo.email}
                              </div>
                            )}
                          </div>

                          {/* Таблица товаров поставщика с прокруткой */}
                          <div className="relative">
                            <div
                              className={`overflow-x-auto ${
                                supplierGroup.products.length > 8
                                  ? "max-h-72 overflow-y-auto"
                                  : ""
                              }`}
                            >
                              <table className="text-md w-full">
                                <thead className="sticky top-0 z-10 bg-blue-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap text-blue-900">
                                      Штрихкод
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap text-blue-900">
                                      Наименование
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap text-blue-900">
                                      Кол-во
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap text-blue-900">
                                      Цена за шт.
                                    </th>
                                    <th className="px-3 py-2 text-left font-semibold whitespace-nowrap text-blue-900">
                                      Сумма
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {supplierGroup.products.map(
                                    (product, productIndex) => (
                                      <tr
                                        key={`${supplierGroup.supplierName}-${product.barcode}-${productIndex}`}
                                        className="border-b border-blue-100 hover:bg-blue-50"
                                      >
                                        <td className="px-3 py-2 font-mono whitespace-nowrap text-blue-900">
                                          {product.barcode}
                                        </td>
                                        <td className="px-3 py-2 text-blue-700">
                                          {product.productName || "Не указано"}
                                        </td>
                                        <td className="px-3 py-2 text-center whitespace-nowrap text-blue-700">
                                          {product.quantity}
                                        </td>
                                        <td className="px-3 py-2 text-right whitespace-nowrap text-blue-700">
                                          {formatPrice(product.unitPrice)}
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold whitespace-nowrap text-blue-700">
                                          {formatPrice(product.totalPrice)}
                                        </td>
                                      </tr>
                                    ),
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </motion.div>
                      ),
                    )}
                  </div>
                )}

                {/* Таблица с товарами, которые не были найдены */}
                {getManualProcessingProducts(analysisResults).length > 0 && (
                  <div className="mb-6">
                    <h4 className="mb-4 text-lg font-semibold text-amber-900">
                      Товары, требующие ручной обработки:
                    </h4>
                    <div className="rounded-lg border border-amber-200 bg-amber-50">
                      <div className="relative">
                        <div
                          className={`overflow-x-auto ${
                            getManualProcessingProducts(analysisResults)
                              .length > 8
                              ? "max-h-96 overflow-y-auto"
                              : ""
                          }`}
                        >
                          <table className="text-md w-full">
                            <thead className="sticky top-0 z-10 bg-amber-100">
                              <tr>
                                <th className="px-3 py-2 text-left font-semibold whitespace-nowrap text-amber-900">
                                  Штрихкод
                                </th>
                                <th className="px-3 py-2 text-left font-semibold whitespace-nowrap text-amber-900">
                                  Наименование
                                </th>
                                <th className="px-3 py-2 text-left font-semibold whitespace-nowrap text-amber-900">
                                  Кол-во
                                </th>
                                <th className="px-3 py-2 text-left font-semibold whitespace-nowrap text-amber-900">
                                  Сообщение
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {getManualProcessingProducts(analysisResults).map(
                                (product, index) => (
                                  <tr
                                    key={`not-found-${product.barcode}-${index}`}
                                    className="border-b border-amber-200 hover:bg-amber-100"
                                  >
                                    <td className="px-3 py-2 font-mono whitespace-nowrap text-amber-900">
                                      {product.barcode}
                                    </td>
                                    <td className="px-3 py-2 text-amber-700">
                                      {product.productName || "Не найдено"}
                                    </td>
                                    <td className="px-3 py-2 text-center whitespace-nowrap text-amber-700">
                                      {product.quantity}
                                    </td>
                                    <td className="px-3 py-2 text-amber-700">
                                      {product.message ||
                                        "Требуется ручная обработка"}
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Индикатор прокрутки для больших таблиц */}
                        {getManualProcessingProducts(analysisResults).length >
                          8 && (
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 transform rounded-full bg-amber-600 px-3 py-1 text-xs text-white opacity-90">
                            Прокрутите для просмотра всех товаров
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Сводная информация */}
                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-blue-200 pt-6 sm:grid-cols-4">
                  <div className="rounded-lg bg-blue-100 p-4 text-center">
                    <div className="text-2xl font-bold text-blue-900">
                      {analysisResults.length}
                    </div>
                    <div className="text-md text-blue-600">Всего запрошено</div>
                  </div>
                  <div className="rounded-lg bg-green-100 p-4 text-center">
                    <div className="text-2xl font-bold text-green-900">
                      {getTotalFoundQuantity()}
                    </div>
                    <div className="text-md text-green-600">
                      Найдено товаров
                    </div>
                  </div>
                  <div className="rounded-lg bg-amber-100 p-4 text-center">
                    <div className="text-2xl font-bold text-amber-900">
                      {getManualProcessingCount()}
                    </div>
                    <div className="text-md text-amber-600">
                      Требуют проверки
                    </div>
                  </div>
                  <div className="rounded-lg bg-blue-100 p-4 text-center">
                    <div className="text-2xl font-bold text-blue-900">
                      {formatPrice(getTotalCost())} ₽
                    </div>
                    <div className="text-md text-blue-600">Общая стоимость</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Инструкция */}
            {!showResults && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="from-blue-25 mt-12 rounded-2xl border border-blue-100 bg-gradient-to-r to-blue-50 p-8"
              >
                <h3 className="mb-6 text-center text-2xl font-semibold text-blue-900">
                  Как работает анализ цен?
                </h3>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="p-4 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <span className="font-bold">1</span>
                    </div>
                    <h4 className="mb-2 font-semibold text-blue-900">
                      Скачайте шаблон
                    </h4>
                    <p className="text-md text-blue-700">
                      Получите готовый файл Excel с правильной структурой для
                      заполнения
                    </p>
                  </div>
                  <div className="p-4 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <span className="font-bold">2</span>
                    </div>
                    <h4 className="mb-2 font-semibold text-blue-900">
                      Заполните данные
                    </h4>
                    <p className="text-md text-blue-700">
                      Внесите информацию о товарах: штрих-коды и количество
                    </p>
                  </div>
                  <div className="p-4 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                      <span className="font-bold">3</span>
                    </div>
                    <h4 className="mb-2 font-semibold text-blue-900">
                      Получите анализ
                    </h4>
                    <p className="text-md text-blue-700">
                      Система автоматически подберет поставщиков с лучшими
                      ценами
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </div>
      <Footer />
    </div>
  );
}

export default Home;
