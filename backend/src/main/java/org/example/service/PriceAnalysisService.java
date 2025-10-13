package org.example.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.example.dto.PriceAnalysisResult;
import org.example.entity.History;
import org.example.entity.Product;
import org.example.repository.ProductRepository;
import org.example.util.CurrentUserUtil;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PriceAnalysisService {

    private final ProductRepository productRepository;
    private final HistoryService historyService;
    private final CurrentUserUtil currentUserUtil;
    private final ObjectMapper objectMapper;

    public List<PriceAnalysisResult> analyzePrices(MultipartFile file) {
        long startTime = System.currentTimeMillis();
        List<PriceAnalysisResult> results = new ArrayList<>();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            int barcodeCol = findColumnIndex(sheet, "Штрихкод");
            int quantityCol = findColumnIndex(sheet, "Количество");

            if (barcodeCol == -1 || quantityCol == -1) {
                throw new IllegalArgumentException("Не найдены необходимые заголовки 'Штрихкод' или 'Количество' в файле. Убедитесь, что файл предназначен для анализа цен.");
            }

            List<String> barcodes = new ArrayList<>();
            Map<String, Integer> barcodeQuantities = new HashMap<>();

            // Парсим файл для сохранения содержимого с очисткой
            List<Map<String, Object>> fileContent = parseExcelToJson(file);

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                String barcode = getCellStringValue(row.getCell(barcodeCol));
                Integer quantity = getCellIntegerValue(row.getCell(quantityCol));

                if (barcode == null || barcode.trim().isEmpty() || quantity == null || quantity <= 0) {
                    continue;
                }

                barcode = barcode.trim();
                barcodes.add(barcode);
                barcodeQuantities.put(barcode, quantity);
            }

            if (barcodes.isEmpty()) {
                return results;
            }

            List<Product> products = productRepository.findByBarcodesOrderedByPrice(barcodes);
            Map<String, Product> minPriceProducts = new HashMap<>();
            for (Product p : products) {
                String bc = p.getBarcode();
                if (!minPriceProducts.containsKey(bc) || p.getPriceWithVat() < minPriceProducts.get(bc).getPriceWithVat()) {
                    minPriceProducts.put(bc, p);
                }
            }

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

            String requestDetails = "Анализ цен: файл " + file.getOriginalFilename();
            String responseDetails = objectMapper.writeValueAsString(results);
            historyService.saveHistory(currentUserUtil.getCurrentClient(), requestDetails, responseDetails, fileContent, History.HistoryType.PRICE_ANALYSIS);

            return results;
        } catch (Exception e) {
            log.error("Ошибка обработки файла", e);
            throw new RuntimeException("Ошибка обработки файла: " + e.getMessage());
        }
    }

    private List<Map<String, Object>> parseExcelToJson(MultipartFile file) throws Exception {
        List<Map<String, Object>> data = new ArrayList<>();
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) return data;

            List<String> headers = new ArrayList<>();
            for (Cell cell : headerRow) {
                headers.add(getCellStringValue(cell));
            }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                Map<String, Object> rowData = new HashMap<>();
                for (int j = 0; j < headers.size(); j++) {
                    String header = headers.get(j);
                    if (header != null && !header.trim().isEmpty()) {
                        Object value = getCellValue(row.getCell(j));
                        // Очистка от управляющих символов
                        if (value instanceof String) {
                            value = ((String) value).replaceAll("[\\r\\n\\t]", "");
                        }
                        rowData.put(header, value);
                    }
                }
                data.add(rowData);
            }
        }
        return data;
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
        Object value = getCellValue(cell);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return null;
    }

    private Object getCellValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue().trim();
            case NUMERIC -> cell.getNumericCellValue();
            case BOOLEAN -> cell.getBooleanCellValue();
            default -> null;
        };
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
}