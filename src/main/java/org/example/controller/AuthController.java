package org.example.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.example.dto.JwtResponse;
import org.example.dto.LoginRequest;
import org.example.dto.RegistrationRequest;
import org.example.dto.RegistrationResponse;
import org.example.entity.Client;
import org.example.service.AuthService;
import org.example.security.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Аутентификация", description = "API для регистрации, авторизации и проверки ИНН")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    @Operation(summary = "Регистрация клиента", description = "Регистрация нового клиента в системе")
    public ResponseEntity<RegistrationResponse> register(@Valid @RequestBody RegistrationRequest request) {
        Client client = authService.registerClient(request);
        String token = jwtUtil.generateToken(client.getPhone());
        RegistrationResponse response = new RegistrationResponse(
                client.getId(),
                client.getFullName(),
                client.getPhone(),
                token,
                client.getRole()
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    @Operation(summary = "Авторизация клиента", description = "Авторизация по телефону и паролю")
    public ResponseEntity<JwtResponse> login(@Valid @RequestBody LoginRequest request) {
        String token = authService.login(request);
        return ResponseEntity.ok(new JwtResponse(token));
    }

    @PostMapping("/validate-inn")
    @Operation(summary = "Проверка ИНН", description = "Проверка валидности ИНН")
    public ResponseEntity<Map<String, Boolean>> validateInn(@RequestBody Map<String, String> request) {
        String inn = request.get("inn");
        boolean isValid = authService.validateInn(inn);
        return ResponseEntity.ok(Map.of("valid", isValid));
    }
}