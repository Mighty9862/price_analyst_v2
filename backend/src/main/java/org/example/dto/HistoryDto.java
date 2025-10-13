package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoryDto {
    private Long id;
    private LocalDateTime timestamp;
    private String requestDetails;
    private List<PriceAnalysisResult> responseDetails;
}