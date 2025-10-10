package org.example.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.example.dto.PriceAnalysisResult;
import org.example.entity.Product;
import org.example.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PriceAnalysisService {

    private final ProductRepository productRepository;

    public List<PriceAnalysisResult> analyzePrices(MultipartFile file) {
        long startTime = System.currentTimeMillis();
        List<PriceAnalysisResult> results = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            // Индексы колонок
            int barcodeCol = findColumnIndex(sheet, "Штрихкод");
            int quantityCol = findColumnIndex(sheet, "Количество");

            if (barcodeCol == -1 || quantityCol == -1) {
                throw new IllegalArgumentException("Не найдены необходимые заголовки 'Штрихкод' или 'Количество' в файле. Убедитесь, что файл предназначен для анализа цен (только штрихкоды и количества), а не для загрузки данных поставщиков.");
            }

            log.info("Using columns - Barcode: {}, Quantity: {}", barcodeCol, quantityCol);

            // Собираем штрихкоды и количества
            List<String> barcodes = new ArrayList<>();
            Map<String, Integer> barcodeQuantities = new HashMap<>();

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String barcode = getCellStringValue(row.getCell(barcodeCol));
                Integer quantity = getCellIntegerValue(row.getCell(quantityCol));

                if (barcode == null || barcode.trim().isEmpty() || quantity == null || quantity <= 0) {
                    continue; // Пропускаем некорректные строки
                }

                barcode = barcode.trim();
                barcodes.add(barcode);
                barcodeQuantities.put(barcode, quantity);
            }

            if (barcodes.isEmpty()) {
                return results;
            }

            // Один запрос на все продукты с сортировкой по цене
            List<Product> products = productRepository.findByBarcodesOrderedByPrice(barcodes);

            // Группируем по штрихкоду и берем продукт с мин. ценой
            Map<String, Product> minPriceProducts = new HashMap<>();
            for (Product p : products) {
                String bc = p.getBarcode();
                if (!minPriceProducts.containsKey(bc) || p.getPriceWithVat() < minPriceProducts.get(bc).getPriceWithVat()) {
                    minPriceProducts.put(bc, p);
                }
            }

            // Формируем результаты
            for (Map.Entry<String, Integer> entry : barcodeQuantities.entrySet()) {
                String barcode = entry.getKey();
                Integer quantity = entry.getValue();
                Product minProduct = minPriceProducts.get(barcode);

                if (minProduct == null) {
                    results.add(PriceAnalysisResult.builder()
                            .barcode(barcode)
                            .quantity(quantity)
                            .requiresManualProcessing(true)
                            .message("Товар не найден в базе")
                            .build());
                    continue;
                }

                double totalPrice = minProduct.getPriceWithVat() * quantity;
                String message = String.format("Поставщик %s по цене %.2f за единицу",
                        minProduct.getSupplier().getSupplierName(), minProduct.getPriceWithVat());

                results.add(PriceAnalysisResult.builder()
                        .barcode(barcode)
                        .quantity(quantity)
                        .productName(minProduct.getProductName())
                        .supplierName(minProduct.getSupplier().getSupplierName())
                        .unitPrice(minProduct.getPriceWithVat())
                        .totalPrice(totalPrice)
                        .requiresManualProcessing(false)
                        .message(message)
                        .build());
            }

            log.info("Анализ завершен за {} мс для {} элементов", (System.currentTimeMillis() - startTime), results.size());

        } catch (Exception e) {
            log.error("Ошибка обработки файла", e);
            throw new RuntimeException("Ошибка обработки файла: " + e.getMessage());
        }

        return results;
    }

    private int findColumnIndex(Sheet sheet, String expectedHeader) {
        Row headerRow = sheet.getRow(0);
        if (headerRow == null) return -1;

        String normalizedExpected = expectedHeader.trim().replaceAll("\\s+", "").toLowerCase();

        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            String cellValue = getCellStringValue(headerRow.getCell(i));
            if (cellValue != null) {
                String normalizedCell = cellValue.trim().replaceAll("\\s+", "").toLowerCase();
                if (normalizedCell.equals(normalizedExpected)) {
                    return i;
                }
            }
        }
        return -1;
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default -> null;
        };
    }

    private Integer getCellIntegerValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case NUMERIC -> (int) cell.getNumericCellValue();
            case STRING -> {
                try {
                    yield Integer.parseInt(cell.getStringCellValue());
                } catch (NumberFormatException e) {
                    yield null;
                }
            }
            default -> null;
        };
    }
}