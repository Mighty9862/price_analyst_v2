package org.example.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.example.dto.ExcelUploadResponse;
import org.example.entity.Product;
import org.example.entity.Supplier;
import org.example.repository.ProductRepository;
import org.example.repository.SupplierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExcelProcessingService {

    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;

    @Transactional
    public ExcelUploadResponse processSupplierDataFile(MultipartFile file) throws Exception {
        long startTime = System.currentTimeMillis();

        ExcelUploadResponse response = ExcelUploadResponse.builder().build();
        int newRecords = 0;
        int updatedRecords = 0;
        int unchangedRecords = 0;
        int failed = 0;
        int skipped = 0;

        Map<String, Boolean> fileDuplicateCheckCache = new HashMap<>(); // Для пропуска дубликатов в файле по supplier + barcode

        // Кэш поставщиков
        Map<String, Supplier> supplierCache = new HashMap<>();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getSheetAt(0);

            // Определяем индексы колонок
            int supplierNameCol = findColumnIndex(sheet, "Наименование поставщика");
            int barcodeCol = findColumnIndex(sheet, "Штрих код");
            int productNameCol = findColumnIndex(sheet, "Наименование");
            int priceCol = findColumnIndex(sheet, "ПЦ с НДС опт");

            if (supplierNameCol == -1 || barcodeCol == -1 || productNameCol == -1 || priceCol == -1) {
                throw new IllegalArgumentException("Не найдены все необходимые заголовки в файле. Убедитесь, что файл предназначен для загрузки данных поставщиков, а не для анализа цен.");
            }

            log.info("Detected columns - SupplierName: {}, Barcode: {}, ProductName: {}, Price: {}", supplierNameCol, barcodeCol, productNameCol, priceCol);

            List<Product> batchProducts = new ArrayList<>();
            int batchSize = 1000;

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                try {
                    String supplierName = getCellStringValue(row.getCell(supplierNameCol));
                    String barcode = getCellStringValue(row.getCell(barcodeCol));
                    String productName = getCellStringValue(row.getCell(productNameCol));
                    Double price = getCellNumericValue(row.getCell(priceCol));

                    if (supplierName == null || supplierName.trim().isEmpty() || barcode == null || barcode.trim().isEmpty()) {
                        throw new IllegalArgumentException("Не указан поставщик или штрихкод");
                    }

                    supplierName = supplierName.trim();
                    barcode = barcode.trim();
                    if (productName != null) productName = productName.trim();

                    // Проверка дубликата в файле по supplier + barcode
                    String duplicateKey = supplierName + "|" + barcode;
                    if (fileDuplicateCheckCache.containsKey(duplicateKey)) {
                        skipped++;
                        log.debug("Пропущен дубликат в файле: поставщик {}, штрихкод {}", supplierName, barcode);
                        continue;
                    }
                    fileDuplicateCheckCache.put(duplicateKey, true);

                    // Кэш поставщиков
                    Supplier supplier = supplierCache.computeIfAbsent(supplierName, name ->
                            supplierRepository.findById(name).orElseGet(() -> {
                                Supplier newSupplier = Supplier.builder().supplierName(name).build();
                                return supplierRepository.save(newSupplier);
                            }));

                    // Проверка существования в БД
                    Optional<Product> existingProduct = productRepository.findBySupplier_SupplierNameAndBarcode(supplierName, barcode);

                    if (existingProduct.isPresent()) {
                        Product existing = existingProduct.get();
                        boolean changed = !Objects.equals(existing.getProductName(), productName) ||
                                !Objects.equals(existing.getPriceWithVat(), price);

                        if (changed) {
                            existing.setProductName(productName);
                            existing.setPriceWithVat(price);
                            batchProducts.add(existing);
                            updatedRecords++;
                            log.debug("Обновлён продукт: поставщик {}, штрихкод {}", supplierName, barcode);
                        } else {
                            unchangedRecords++;
                            log.debug("Без изменений: поставщик {}, штрихкод {}", supplierName, barcode);
                        }
                    } else {
                        Product newProduct = Product.builder()
                                .supplier(supplier)
                                .barcode(barcode)
                                .productName(productName)
                                .priceWithVat(price)
                                .build();
                        batchProducts.add(newProduct);
                        newRecords++;
                        log.debug("Добавлен новый продукт: поставщик {}, штрихкод {}", supplierName, barcode);
                    }

                    if (batchProducts.size() >= batchSize) {
                        productRepository.saveAll(batchProducts);
                        batchProducts.clear();
                    }
                } catch (Exception e) {
                    failed++;
                    log.warn("Ошибка обработки строки {}: {}", i + 1, e.getMessage(), e);
                }
            }

            if (!batchProducts.isEmpty()) {
                productRepository.saveAll(batchProducts);
            }

            String message = String.format("Добавлено: %d, обновлено: %d, без изменений: %d, пропущено дубликатов: %d, ошибок: %d. Время: %d мс",
                    newRecords, updatedRecords, unchangedRecords, skipped, failed, (System.currentTimeMillis() - startTime));

            response.setSuccess(true);
            response.setMessage(message);
            response.setNewRecords(newRecords);
            response.setUpdatedRecords(updatedRecords);
            response.setUnchangedRecords(unchangedRecords);
            response.setProcessedRecords(newRecords + updatedRecords);
            response.setFailedRecords(failed);

            log.info("Обработка завершена: {}", message);

            return response;

        }
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
                    log.debug("Найдена колонка '{}' в позиции {}", expectedHeader, i);
                    return i;
                }
            }
        }
        log.warn("Не найдена колонка '{}'", expectedHeader);
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

    private Double getCellNumericValue(Cell cell) {
        if (cell == null) return 0.0;
        return switch (cell.getCellType()) {
            case NUMERIC -> cell.getNumericCellValue();
            case STRING -> {
                String value = cell.getStringCellValue().replace(",", ".").trim();
                try {
                    yield Double.parseDouble(value);
                } catch (NumberFormatException e) {
                    log.warn("Ошибка парсинга цены: '{}'", value);
                    yield 0.0;
                }
            }
            default -> 0.0;
        };
    }
}