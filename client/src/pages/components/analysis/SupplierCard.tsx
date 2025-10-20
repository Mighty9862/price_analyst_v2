import { m } from "framer-motion";
import { formatPrice } from "@/utils/formatters";
import type { SupplierInfo } from "@/types/analysis.type";

interface SupplierCardProps {
  supplierName: string;
  info: SupplierInfo | null;
  productCount: number;
  totalPrice: number;
  rank: number;
}

export const SupplierCard = ({
  supplierName,
  info,
  productCount,
  totalPrice,
  rank,
}: SupplierCardProps) => {
  return (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="rounded-lg border border-blue-200 bg-white p-4"
    >
      <div className="mb-3 text-center">
        <div className="text-2xl font-bold text-blue-900">#{rank}</div>
        <div className="text-xl font-semibold text-blue-800">
          {supplierName}
        </div>
        <div className="text-md text-blue-600">
          {productCount} товар
          {productCount === 1
            ? ""
            : productCount > 1 && productCount < 5
              ? "а"
              : "ов"}
        </div>
        {totalPrice > 0 && (
          <div className="mt-1 text-lg font-semibold text-green-700">
            {formatPrice(totalPrice)} ₽
          </div>
        )}
      </div>

      {info && (
        <div className="text-md border-t border-blue-200 pt-3">
          {info.inn && (
            <div className="mb-1">
              <span className="font-semibold">ИНН:</span> {info.inn}
            </div>
          )}
          {info.address && (
            <div className="mb-1">
              <span className="font-semibold">Адрес:</span>{" "}
              <span className="break-words">{info.address}</span>
            </div>
          )}
          {info.phone && (
            <div className="mb-1">
              <span className="font-semibold">Телефоны:</span>{" "}
              {info.phone.split(", ").map((phone, idx) => (
                <div key={idx} className="text-md">
                  {phone}
                </div>
              ))}
            </div>
          )}
          {info.email && (
            <div className="mb-1">
              <span className="font-semibold">Электронная почта:</span>{" "}
              {info.email}
            </div>
          )}
        </div>
      )}
    </m.div>
  );
};
