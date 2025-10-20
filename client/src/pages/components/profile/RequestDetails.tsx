import type { UserRequest } from "@/types/analysis.type";
import { RequestResultsTable } from "./RequestResultsTable";
import { TopSuppliers } from "./TopSuppliers";

interface RequestDetailsProps {
  request: UserRequest;
}

export const RequestDetails = ({ request }: RequestDetailsProps) => {
  return (
    <div className="p-4">
      {/* Топ поставщиков с полной информацией */}
      <TopSuppliers request={request} />

      <h4 className="mb-4 font-semibold text-blue-900">
        Результаты анализа ({request.responseDetails.length} товаров)
      </h4>

      <RequestResultsTable request={request} />
    </div>
  );
};
