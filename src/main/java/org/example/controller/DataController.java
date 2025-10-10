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

import java.io.IOException;
import java.util.List;

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
}