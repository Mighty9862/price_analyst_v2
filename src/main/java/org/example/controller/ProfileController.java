package org.example.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.example.dto.HistoryDto;
import org.example.util.CurrentUserUtil;
import org.example.service.HistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@Tag(name = "Профиль", description = "API для работы с профилем пользователя")
public class ProfileController {

    private final CurrentUserUtil currentUserUtil;
    private final HistoryService historyService;

    @GetMapping("/history")
    @Operation(summary = "Получить историю запросов", description = "Возвращает историю всех запросов пользователя с ответами и датами")
    public ResponseEntity<List<HistoryDto>> getHistory() {
        List<HistoryDto> history = historyService.getHistoryForClient(currentUserUtil.getCurrentClient());
        return ResponseEntity.ok(history);
    }
}