package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExcelUploadResponse {
    private boolean success;
    private String message;
    private int newRecords;
    private int updatedRecords;
    private int unchangedRecords;
    private int processedRecords;
    private int failedRecords;
}