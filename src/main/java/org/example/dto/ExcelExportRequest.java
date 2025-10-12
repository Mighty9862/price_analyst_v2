package org.example.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class ExcelExportRequest {
    private List<Map<String, Object>> data;
}