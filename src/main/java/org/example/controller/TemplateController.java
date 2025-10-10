package org.example.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/template")
@RequiredArgsConstructor
@Tag(name = "Шаблоны", description = "API для работы с шаблонами файлов")
public class TemplateController {

    @GetMapping("/download")
    @Operation(summary = "Скачать шаблон", description = "Скачать шаблон Excel файла для загрузки данных")
    public void downloadTemplate(HttpServletResponse response) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=price_analysis_template.xlsx");

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Шаблон для анализа цен");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"Штрихкод", "Количество"};

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            Row exampleRow1 = sheet.createRow(1);
            exampleRow1.createCell(0).setCellValue("4600905000332");
            exampleRow1.createCell(1).setCellValue(10);

            Row exampleRow2 = sheet.createRow(2);
            exampleRow2.createCell(0).setCellValue("4600905000264");
            exampleRow2.createCell(1).setCellValue(5);

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(response.getOutputStream());
        }
    }

    @GetMapping("/download-supplier")
    @Operation(summary = "Скачать шаблон для поставщиков", description = "Скачать шаблон Excel файла для загрузки данных поставщиков")
    public void downloadSupplierTemplate(HttpServletResponse response) throws IOException {
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=supplier_template.xlsx");

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Шаблон для поставщиков");

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"Наименование поставщика", "Штрих код", "Наименование", "ПЦ с НДС опт"};

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Примеры строк
            Row exampleRow1 = sheet.createRow(1);
            exampleRow1.createCell(0).setCellValue("ЗАО \"Аист\"");
            exampleRow1.createCell(1).setCellValue("4600905000332");
            exampleRow1.createCell(2).setCellValue("Отбеливатель БОС Плюс (Россия) 600г");
            exampleRow1.createCell(3).setCellValue(129.68);

            Row exampleRow2 = sheet.createRow(2);
            exampleRow2.createCell(0).setCellValue("ЗАО \"Аист\"");
            exampleRow2.createCell(1).setCellValue("4600905000264");
            exampleRow2.createCell(2).setCellValue("Средство САНОКС чист.д/мытья сантехники (Россия) 0,75л");
            exampleRow2.createCell(3).setCellValue(82.52);

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(response.getOutputStream());
        }
    }
}