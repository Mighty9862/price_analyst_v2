import type { AnalysisStats } from "@/types/analysis.type";
import { formatPrice } from "@/utils/formatters";

interface StatsCardsProps {
  stats: AnalysisStats;
}

export const StatsCards = ({ stats }: StatsCardsProps) => {
  return (
    <div className="mt-6 grid grid-cols-2 gap-4 border-t border-blue-200 pt-6 sm:grid-cols-4">
      <div className="rounded-lg bg-blue-100 p-4 text-center">
        <div className="text-2xl font-bold text-blue-900">
          {stats.totalRequested}
        </div>
        <div className="text-md text-blue-600">Всего запрошено</div>
      </div>
      <div className="rounded-lg bg-green-100 p-4 text-center">
        <div className="text-2xl font-bold text-green-900">
          {stats.totalFound}
        </div>
        <div className="text-md text-green-600">Найдено товаров</div>
      </div>
      <div className="rounded-lg bg-amber-100 p-4 text-center">
        <div className="text-2xl font-bold text-amber-900">
          {stats.manualProcessingCount}
        </div>
        <div className="text-md text-amber-600">Требуют проверки</div>
      </div>
      <div className="rounded-lg bg-blue-100 p-4 text-center">
        <div className="text-2xl font-bold text-blue-900">
          {formatPrice(stats.totalCost)} ₽
        </div>
        <div className="text-md text-blue-600">Общая стоимость</div>
      </div>
    </div>
  );
};
