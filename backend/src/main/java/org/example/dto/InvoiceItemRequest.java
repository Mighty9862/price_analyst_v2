package org.example.dto;

import lombok.Data;

@Data
public class InvoiceItemRequest {
    private String barcode;
    private String productName;
    private Integer quantity;
    private Double unitPrice;
    private Double totalPrice;
}