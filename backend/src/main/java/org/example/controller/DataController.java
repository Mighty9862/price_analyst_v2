package org.example.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.example.dto.ExcelUploadResponse;
import org.example.dto.PriceAnalysisResult;
import org.example.entity.Product;
import org.example.repository.ProductRepository;
import org.example.service.ExcelProcessingService;
import org.example.service.PriceAnalysisService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Cell;
import org.example.dto.InvoiceItemRequest;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Comparator;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/data")
@RequiredArgsConstructor
@Tag(name = "Данные", description = "API для работы с данными")
public class DataController {

    private final ExcelProcessingService excelProcessingService;
    private final PriceAnalysisService priceAnalysisService;
    private final ProductRepository productRepository;

    @PostMapping(value = "/upload-supplier-data", consumes = "multipart/form-data")
    @Operation(summary = "Загрузка данных поставщиков", description = "Загрузка Excel файла с данными поставщиков и товаров")
    public ResponseEntity<?> uploadSupplierData(
            @Parameter(description = "Excel файл с данными поставщиков", required = true)
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Файл не должен быть пустым");
        }

        if (!file.getOriginalFilename().endsWith(".xlsx") && !file.getOriginalFilename().endsWith(".xls")) {
            return ResponseEntity.badRequest().body("Поддерживаются только Excel файлы (.xlsx, .xls)");
        }

        try {
            ExcelUploadResponse response = excelProcessingService.processSupplierDataFile(file);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка обработки файла: " + e.getMessage());
        }
    }

    @PostMapping(value = "/analyze-prices", consumes = "multipart/form-data")
    @Operation(summary = "Анализ цен", description = "Анализ лучших цен на основе загруженного файла с товарами. Файл должен содержать колонки: Штрихкод и Количество")
    public ResponseEntity<?> analyzePrices(
            @Parameter(description = "Excel файл с товарами для анализа", required = true)
            @RequestParam("file") MultipartFile file) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Файл не должен быть пустым");
        }

        if (!file.getOriginalFilename().endsWith(".xlsx") && !file.getOriginalFilename().endsWith(".xls")) {
            return ResponseEntity.badRequest().body("Поддерживаются только Excel файлы (.xlsx, .xls)");
        }

        try {
            List<PriceAnalysisResult> results = priceAnalysisService.analyzePrices(file);
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Ошибка обработки файла: " + e.getMessage());
        }
    }

    @GetMapping("/download-database")
    @Operation(summary = "Выгрузка базы данных", description = "Скачать Excel файл с полной базой данных продуктов")
    public void downloadDatabase(HttpServletResponse response) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=database_export.xlsx");

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("База данных");

            // Заголовки
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Наименование поставщика", "Штрих код", "Наименование", "ПЦ с НДС опт"};
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }

            // Данные
            List<Product> allProducts = productRepository.findAll();
            int rowNum = 1;
            for (Product p : allProducts) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(p.getSupplier().getSupplierName());
                row.createCell(1).setCellValue(p.getBarcode());
                row.createCell(2).setCellValue(p.getProductName() != null ? p.getProductName() : "");
                row.createCell(3).setCellValue(p.getPriceWithVat() != null ? p.getPriceWithVat() : 0.0);
            }

            // Авторазмер колонок
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(response.getOutputStream());
        }
    }

    @PostMapping("/export-analysis")
    @Operation(summary = "Выгрузка результата анализа в Excel", description = "Скачать Excel файл с результатами анализа цен")
    public void exportAnalysis(@RequestBody List<PriceAnalysisResult> results, HttpServletResponse response) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=price_analysis_export.xlsx");

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Результат анализа");

            // Заголовки
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Штрихкод", "Количество", "Наименование товара", "Поставщик", "Цена за единицу", "Общая сумма", "Требует ручной обработки", "Сообщение"};
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }

            // Данные
            int rowNum = 1;
            for (PriceAnalysisResult result : results) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(result.getBarcode() != null ? result.getBarcode() : "");
                row.createCell(1).setCellValue(result.getQuantity() != null ? result.getQuantity() : 0);
                row.createCell(2).setCellValue(result.getProductName() != null ? result.getProductName() : "");
                row.createCell(3).setCellValue(result.getSupplierName() != null ? result.getSupplierName() : "");
                row.createCell(4).setCellValue(result.getUnitPrice() != null ? result.getUnitPrice() : 0.0);
                row.createCell(5).setCellValue(result.getTotalPrice() != null ? result.getTotalPrice() : 0.0);
                row.createCell(6).setCellValue(result.getRequiresManualProcessing() != null && result.getRequiresManualProcessing() ? "Да" : "Нет");
                row.createCell(7).setCellValue(result.getMessage() != null ? result.getMessage() : "");
            }

            // Авторазмер колонок
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(response.getOutputStream());
        }
    }

    @PostMapping("/export-detailed-analysis")
    @Operation(summary = "Выгрузка детального анализа цен в Excel", description = "Скачать Excel файл с детальным анализом всех цен по каждому товару")
    public void exportDetailedAnalysis(@RequestBody List<PriceAnalysisResult> results, HttpServletResponse response) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=detailed_price_analysis_export.xlsx");

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Детальный анализ цен");

            // Создаем стили
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            CellStyle numberStyle = workbook.createCellStyle();
            numberStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0.00"));

            CellStyle percentageStyle = workbook.createCellStyle();
            percentageStyle.setDataFormat(workbook.createDataFormat().getFormat("0.00\"%\""));

            // Заголовки
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Штрихкод", "Количество", "Наименование товара", "Поставщик", "Цена за единицу", "Процент", "Общая сумма", "Требует ручной обработки"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = 1;

            for (PriceAnalysisResult result : results) {
                if (result.getRequiresManualProcessing() != null && result.getRequiresManualProcessing()) {
                    // Товары, требующие ручной обработки
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(result.getBarcode() != null ? result.getBarcode() : "");
                    row.createCell(1).setCellValue(result.getQuantity() != null ? result.getQuantity() : 0);
                    row.createCell(2).setCellValue("Товар не найден");
                    row.createCell(3).setCellValue("");
                    row.createCell(4).setCellValue("");
                    row.createCell(5).setCellValue("");
                    row.createCell(6).setCellValue("");
                    row.createCell(7).setCellValue("Да");
                } else {
                    // Получаем все предложения по этому штрихкоду
                    List<Product> allProducts = productRepository.findByBarcode(result.getBarcode());
                    
                    if (allProducts.isEmpty()) {
                        // Если товар не найден в базе
                        Row row = sheet.createRow(rowNum++);
                        row.createCell(0).setCellValue(result.getBarcode() != null ? result.getBarcode() : "");
                        row.createCell(1).setCellValue(result.getQuantity() != null ? result.getQuantity() : 0);
                        row.createCell(2).setCellValue("Товар не найден в базе");
                        row.createCell(3).setCellValue("");
                        row.createCell(4).setCellValue("");
                        row.createCell(5).setCellValue("");
                        row.createCell(6).setCellValue("");
                        row.createCell(7).setCellValue("Да");
                    } else {
                        // Сортируем товары по цене (от меньшей к большей)
                        List<Product> sortedProducts = allProducts.stream()
                                .filter(p -> p.getPriceWithVat() != null)
                                .sorted(Comparator.comparing(Product::getPriceWithVat))
                                .collect(Collectors.toList());

                        if (sortedProducts.isEmpty()) {
                            // Если все товары без цены
                            Row row = sheet.createRow(rowNum++);
                            row.createCell(0).setCellValue(result.getBarcode() != null ? result.getBarcode() : "");
                            row.createCell(1).setCellValue(result.getQuantity() != null ? result.getQuantity() : 0);
                            row.createCell(2).setCellValue(result.getProductName() != null ? result.getProductName() : "");
                            row.createCell(3).setCellValue("");
                            row.createCell(4).setCellValue("");
                            row.createCell(5).setCellValue("");
                            row.createCell(6).setCellValue("");
                            row.createCell(7).setCellValue("Нет");
                        } else {
                            Double bestPrice = sortedProducts.get(0).getPriceWithVat();
                            boolean isFirstRow = true;

                            for (Product product : sortedProducts) {
                                Row row = sheet.createRow(rowNum++);
                                
                                if (isFirstRow) {
                                    // Первая строка - лучшая цена
                                    row.createCell(0).setCellValue(result.getBarcode() != null ? result.getBarcode() : "");
                                    row.createCell(1).setCellValue(result.getQuantity() != null ? result.getQuantity() : 0);
                                    row.createCell(2).setCellValue(result.getProductName() != null ? result.getProductName() : "");
                                    row.createCell(3).setCellValue(product.getSupplier().getSupplierName());
                                    
                                    Cell priceCell = row.createCell(4);
                                    priceCell.setCellValue(product.getPriceWithVat());
                                    priceCell.setCellStyle(numberStyle);
                                    
                                    // Процент для лучшей цены = 0%
                                    Cell percentageCell = row.createCell(5);
                                    percentageCell.setCellValue(0.0);
                                    percentageCell.setCellStyle(percentageStyle);
                                    
                                    // Общая сумма
                                    Double totalPrice = product.getPriceWithVat() * result.getQuantity();
                                    Cell totalCell = row.createCell(6);
                                    totalCell.setCellValue(totalPrice);
                                    totalCell.setCellStyle(numberStyle);
                                    
                                    row.createCell(7).setCellValue("Нет");
                                    isFirstRow = false;
                                } else {
                                    // Последующие строки - другие предложения
                                    row.createCell(0).setCellValue("");
                                    row.createCell(1).setCellValue("");
                                    row.createCell(2).setCellValue("");
                                    row.createCell(3).setCellValue(product.getSupplier().getSupplierName());
                                    
                                    Cell priceCell = row.createCell(4);
                                    priceCell.setCellValue(product.getPriceWithVat());
                                    priceCell.setCellStyle(numberStyle);
                                    
                                    // Расчет процента разницы от лучшей цены
                                    double percentage = ((product.getPriceWithVat() - bestPrice) / bestPrice) * 100;
                                    Cell percentageCell = row.createCell(5);
                                    percentageCell.setCellValue(percentage);
                                    percentageCell.setCellStyle(percentageStyle);
                                    
                                    row.createCell(6).setCellValue("");
                                    row.createCell(7).setCellValue("");
                                }
                            }
                        }
                    }
                }
            }

            // Авторазмер колонок
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(response.getOutputStream());
        }
    }

    @PostMapping("/export-history-to-excel")
    @Operation(summary = "Выгрузка истории в Excel", description = "Скачать Excel файл с историей на основе входного JSON")
    public void exportHistoryToExcel(@RequestBody List<Map<String, Object>> data, HttpServletResponse response) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=history_export.xlsx");

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("История");

            // Заголовки (изменён порядок: сначала Штрихкод, затем Количество)
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Штрихкод", "Количество"};
            for (int i = 0; i < headers.length; i++) {
                headerRow.createCell(i).setCellValue(headers[i]);
            }

            // Данные (изменён порядок: сначала Штрихкод, затем Количество)
            int rowNum = 1;
            for (Map<String, Object> item : data) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(item.get("Штрихкод") != null ? item.get("Штрихкод").toString() : "");
                row.createCell(1).setCellValue(item.get("Количество") != null ? ((Number) item.get("Количество")).doubleValue() : 0.0);
            }

            // Авторазмер колонок
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(response.getOutputStream());
        }
    }

    @PostMapping("/export-invoice")
    @Operation(summary = "Выгрузка накладной в Excel", description = "Скачать Excel файл в виде накладной на основе переданных данных")
    public void exportInvoice(@RequestBody List<InvoiceItemRequest> invoiceItems, HttpServletResponse response) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=invoice_export.xlsx");

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Накладная");

            // Создаем стиль для заголовков
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            // Заголовки
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Штрихкод", "Наименование", "Количество", "Цена за шт.", "Сумма"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Данные
            int rowNum = 1;
            double totalSum = 0.0;

            for (InvoiceItemRequest item : invoiceItems) {
                Row row = sheet.createRow(rowNum++);
                
                // Штрихкод - форматируем как в примере (научная нотация)
                String barcode = item.getBarcode();
                Cell barcodeCell = row.createCell(0);
                if (barcode != null && !barcode.isEmpty()) {
                    try {
                        double barcodeValue = Double.parseDouble(barcode);
                        barcodeCell.setCellValue(barcodeValue);
                        // Устанавливаем формат ячейки для научной нотации
                        CellStyle scientificStyle = workbook.createCellStyle();
                        scientificStyle.setDataFormat(workbook.createDataFormat().getFormat("0.#####E+00"));
                        barcodeCell.setCellStyle(scientificStyle);
                    } catch (NumberFormatException e) {
                        barcodeCell.setCellValue(barcode);
                    }
                } else {
                    barcodeCell.setCellValue("");
                }
                
                // Наименование
                String productName = item.getProductName();
                row.createCell(1).setCellValue(productName != null ? productName : "");
                
                // Количество
                Integer quantity = item.getQuantity();
                row.createCell(2).setCellValue(quantity != null ? quantity : 0);
                
                // Цена за шт.
                Double unitPrice = item.getUnitPrice();
                Cell priceCell = row.createCell(3);
                if (unitPrice != null) {
                    priceCell.setCellValue(unitPrice);
                    // Форматируем как денежное значение с двумя десятичными знаками
                    CellStyle priceStyle = workbook.createCellStyle();
                    priceStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0.00"));
                    priceCell.setCellStyle(priceStyle);
                } else {
                    priceCell.setCellValue(0.0);
                }
                
                // Сумма
                Double totalPrice = item.getTotalPrice();
                Cell totalCell = row.createCell(4);
                if (totalPrice != null) {
                    totalCell.setCellValue(totalPrice);
                    totalSum += totalPrice;
                    // Форматируем как денежное значение с двумя десятичными знаками
                    CellStyle totalStyle = workbook.createCellStyle();
                    totalStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0.00"));
                    totalCell.setCellStyle(totalStyle);
                } else {
                    totalCell.setCellValue(0.0);
                }
            }

            // Авторазмер колонок
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(response.getOutputStream());
        }
    }
}