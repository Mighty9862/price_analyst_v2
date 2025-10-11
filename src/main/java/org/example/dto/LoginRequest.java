// dto/LoginRequest.java
package org.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Телефон не может быть пустым")
    @Pattern(regexp = "^\\+?[78][-\\(]?\\d{3}\\)?-?\\d{3}-?\\d{2}-?\\d{2}$",
            message = "Неверный формат телефона")
    private String phone;

    @NotBlank(message = "Пароль не может быть пустым")
    private String password;
}