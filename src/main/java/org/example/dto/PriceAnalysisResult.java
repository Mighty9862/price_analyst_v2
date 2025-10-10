package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceAnalysisResult {
    private String barcode;
    private Integer quantity;
    private String productName;
    private String supplierName;
    private Double unitPrice;
    private Boolean requiresManualProcessing;
    private Double totalPrice;
    private String message;
}