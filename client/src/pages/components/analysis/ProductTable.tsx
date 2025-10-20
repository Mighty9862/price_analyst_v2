import { m } from "framer-motion";
import { formatPrice } from "@/utils/formatters";
import type { SupplierGroup } from "@/types/analysis.type";
import Button from "../ui/Button";
import ExportIcon from "../ui/icons/ExportIcon";

interface ProductTableProps {
  supplierGroup: SupplierGroup;
  index: number;
  onExportSupplier: (supplierName: string) => void;
  exportLoading?: boolean;
  currentExportingSupplier?: string | null;
}

export const ProductTable = ({
  supplierGroup,
  index,
  onExportSupplier,
  exportLoading = false,
  currentExportingSupplier = null,
}: ProductTableProps) => {
  const isExporting =
    currentExportingSupplier === supplierGroup.supplierName && exportLoading;

  return (
    <m.div
      key={supplierGroup.supplierName}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
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
                    <strong>ИНН:</strong> {supplierGroup.supplierInfo.inn}
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
          <div className="flex flex-col items-end gap-2">
            <div className="text-lg text-blue-700">
              <div className="font-semibold">
                Всего товаров: {supplierGroup.productCount}
              </div>
              <div className="font-semibold text-green-700">
                Общая стоимость: {formatPrice(supplierGroup.totalCost)} ₽
              </div>
            </div>
            <Button
              onClick={() => onExportSupplier(supplierGroup.supplierName)}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              {isExporting ? (
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
                  <span>Выгрузить поставщика</span>
                </span>
              )}
            </Button>
          </div>
        </div>
        {supplierGroup.supplierInfo?.address && (
          <div className="text-md mt-2 text-blue-600">
            <strong>Адрес:</strong> {supplierGroup.supplierInfo.address}
          </div>
        )}
        {supplierGroup.supplierInfo?.email && (
          <div className="text-md mt-1 text-blue-600">
            <strong>Email:</strong> {supplierGroup.supplierInfo.email}
          </div>
        )}
      </div>

      {/* Таблица товаров */}
      <div className="relative">
        <div
          className={`overflow-x-auto ${
            supplierGroup.products.length > 8 ? "max-h-72 overflow-y-auto" : ""
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
              {supplierGroup.products.map((product, productIndex) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </m.div>
  );
};
