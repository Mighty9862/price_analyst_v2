import type { UserRequest } from "@/types/analysis.type";
import { parseSupplierInfo } from "@/utils/parsers";

interface RequestResultsTableProps {
  request: UserRequest;
}

// Форматирование цены
const formatPrice = (price: number | null) => {
  if (price === null) return "-";
  return new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export const RequestResultsTable = ({ request }: RequestResultsTableProps) => {
  return (
    <div
      className={`overflow-x-auto ${
        request.responseDetails.length > 5 ? "max-h-80 overflow-y-auto" : ""
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
          {request.responseDetails.map((item, itemIndex) => {
            const supplierInfo = parseSupplierInfo(item.supplierName);
            return (
              <tr
                key={itemIndex}
                className={`border-b border-blue-100 ${
                  item.requiresManualProcessing ? "bg-amber-50" : "bg-white"
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
                      <div className="font-semibold">{supplierInfo.name}</div>
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
                    {item.requiresManualProcessing ? "Обработка" : "Найден"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
