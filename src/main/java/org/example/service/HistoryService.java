package org.example.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.dto.HistoryDto;
import org.example.dto.AdminHistoryDto;
import org.example.dto.PriceAnalysisResult;
import org.example.entity.Client;
import org.example.entity.History;
import org.example.repository.HistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class HistoryService {

    private final HistoryRepository historyRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void saveHistory(Client client, String requestDetails, String responseDetails, List<Map<String, Object>> fileContent, History.HistoryType historyType) {
        History history = History.builder()
                .client(client)
                .requestDetails(requestDetails)
                .responseDetails(responseDetails)
                .fileContent(fileContent)
                .historyType(historyType)
                .build();
        historyRepository.save(history);
    }

    public List<HistoryDto> getHistoryForClient(Client client) {
        return historyRepository.findByClientIdOrderByTimestampDesc(client.getId())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<AdminHistoryDto> getAllFileUploadHistory() {
        return historyRepository.findByHistoryTypeOrderByTimestampDesc(History.HistoryType.PRICE_ANALYSIS)
                .stream()
                .map(this::toAdminDto)
                .collect(Collectors.toList());
    }

    private HistoryDto toDto(History history) {
        List<PriceAnalysisResult> responseDetails = null;
        try {
            responseDetails = objectMapper.readValue(history.getResponseDetails(), new TypeReference<List<PriceAnalysisResult>>() {});
        } catch (Exception e) {
            log.error("Ошибка десериализации responseDetails для history ID {}: {}", history.getId(), e.getMessage());
            responseDetails = List.of();
        }
        return new HistoryDto(
                history.getId(),
                history.getTimestamp(),
                history.getRequestDetails(),
                responseDetails
        );
    }

    private AdminHistoryDto toAdminDto(History history) {
        Client client = history.getClient();
        return new AdminHistoryDto(
                client.getFullName(),
                client.getInn(),
                client.getPhone(),
                history.getFileContent(), // Теперь это List<Map<String, Object>>
                history.getTimestamp()
        );
    }
}