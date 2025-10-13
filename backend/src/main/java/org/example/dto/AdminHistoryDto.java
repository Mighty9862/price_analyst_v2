package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminHistoryDto {
    private String fullName;
    private String inn;
    private String phone;
    private List<Map<String, Object>> fileContent; // Изменяем на List<Map>
    private LocalDateTime timestamp;
}