package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceAnalysisResult {
    private String barcode;
    private Integer quantity;
    private String productName;
    private String supplierName;
    private Double unitPrice;
    private Double totalPrice;
    private Boolean requiresManualProcessing;
    private String message;
}