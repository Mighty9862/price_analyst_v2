import type {
  AnalysisStats,
  PriceAnalysisResult,
  SupplierGroup,
} from "@/types/analysis.type";
import { parseSupplierInfo } from "@/utils/parsers";

export const useAnalysis = (results: PriceAnalysisResult[]) => {
  const groupProductsBySupplier = (): SupplierGroup[] => {
    const supplierMap = new Map<string, PriceAnalysisResult[]>();

    results.forEach((item) => {
      if (!item.requiresManualProcessing && item.supplierName) {
        const supplierInfo = parseSupplierInfo(item.supplierName);
        const supplierKey = supplierInfo
          ? supplierInfo.name
          : item.supplierName;

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

  const getManualProcessingProducts = (): PriceAnalysisResult[] => {
    return results.filter((item) => item.requiresManualProcessing);
  };

  const getStats = (): AnalysisStats => {
    return {
      totalRequested: results.length,
      totalFound: results.filter((item) => !item.requiresManualProcessing)
        .length,
      manualProcessingCount: getManualProcessingProducts().length,
      totalCost: results.reduce((sum, item) => sum + (item.totalPrice || 0), 0),
    };
  };

  const getTopSuppliers = (limit: number = 3) => {
    const supplierMap = new Map<
      string,
      { count: number; info: ReturnType<typeof parseSupplierInfo> }
    >();

    results.forEach((item) => {
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

    return Array.from(supplierMap.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, limit);
  };

  return {
    supplierGroups: groupProductsBySupplier(),
    manualProcessingProducts: getManualProcessingProducts(),
    stats: getStats(),
    topSuppliers: getTopSuppliers(3),
    getSupplierTotalPrice: (supplierName: string) => {
      return results
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
    },
  };
};
