package org.example.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.example.dto.AdminHistoryDto;
import org.example.service.HistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Админ", description = "API для административных функций")
@SecurityRequirement(name = "bearerAuth")
public class AdminController {

    private final HistoryService historyService;

    @GetMapping("/file-upload-history")
    @Operation(summary = "Получить историю загрузок файлов", description = "Возвращает историю загрузок файлов всеми пользователями")
    public ResponseEntity<List<AdminHistoryDto>> getFileUploadHistory() {
        List<AdminHistoryDto> history = historyService.getAllFileUploadHistory();
        return ResponseEntity.ok(history);
    }
}