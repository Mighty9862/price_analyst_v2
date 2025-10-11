package org.example.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.dto.HistoryDto;
import org.example.dto.PriceAnalysisResult;
import org.example.entity.Client;
import org.example.entity.History;
import org.example.repository.HistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HistoryService {

    private final HistoryRepository historyRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void saveHistory(Client client, String requestDetails, String responseDetails) {
        History history = History.builder()
                .client(client)
                .requestDetails(requestDetails)
                .responseDetails(responseDetails)
                .build();
        historyRepository.save(history);
    }

    public List<HistoryDto> getHistoryForClient(Client client) {
        return historyRepository.findByClientIdOrderByTimestampDesc(client.getId())
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private HistoryDto toDto(History history) {
        List<PriceAnalysisResult> responseDetails = null;
        try {
            responseDetails = objectMapper.readValue(history.getResponseDetails(), new TypeReference<List<PriceAnalysisResult>>() {});
        } catch (Exception e) {
            responseDetails = List.of(); // Пустой список в случае ошибки
        }
        return new HistoryDto(
                history.getId(),
                history.getTimestamp(),
                history.getRequestDetails(),
                responseDetails
        );
    }
}