package org.example.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.dto.LoginRequest;
import org.example.dto.RegistrationRequest;
import org.example.entity.Client;
import org.example.repository.ClientRepository;
import org.example.security.JwtUtil;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final ClientRepository clientRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;

    public boolean validateInn(String inn) {
        if (inn == null) return false;
        int length = inn.length();
        if (length != 10 && length != 12) return false;
        return inn.matches("\\d+");
    }

    public Client registerClient(RegistrationRequest request) {
        if (!validateInn(request.getInn())) {
            throw new IllegalArgumentException("Неверный формат ИНН");
        }
        if (clientRepository.existsByInn(request.getInn())) {
            throw new IllegalArgumentException("Клиент с таким ИНН уже зарегистрирован");
        }

        String normalizedPhone = normalizePhone(request.getPhone());
        if (normalizedPhone == null) {
            throw new IllegalArgumentException("Неверный формат телефона");
        }
        if (clientRepository.findByPhone(normalizedPhone).isPresent()) {
            throw new IllegalArgumentException("Клиент с таким телефоном уже зарегистрирован");
        }

        Client client = Client.builder()
                .inn(request.getInn())
                .fullName(request.getFullName())
                .phone(normalizedPhone)
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        Client savedClient = clientRepository.save(client);
        log.info("Зарегистрирован новый клиент: phone={}, inn={}", normalizedPhone, request.getInn());
        return savedClient;
    }

    public String login(LoginRequest request) {
        String normalizedPhone = normalizePhone(request.getPhone());
        if (normalizedPhone == null) {
            throw new IllegalArgumentException("Неверный формат телефона");
        }

        Client client = clientRepository.findByPhone(normalizedPhone)
                .orElseThrow(() -> new IllegalArgumentException("Клиент с таким телефоном не найден"));

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(normalizedPhone, request.getPassword())
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String token = jwtUtil.generateToken(normalizedPhone);
            log.info("Успешная авторизация для телефона: {}", normalizedPhone);
            return token;
        } catch (BadCredentialsException e) {
            log.warn("Неудачная попытка авторизации для телефона: {}, причина: неверный пароль", normalizedPhone);
            throw new IllegalArgumentException("Неверный телефон или пароль");
        }
    }

    private String normalizePhone(String phone) {
        if (phone == null) return null;
        String digits = phone.replaceAll("\\D", "");
        if (digits.length() == 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
            return "9" + digits.substring(1);
        } else if (digits.length() == 10 && digits.startsWith("9")) {
            return digits;
        }
        return null;
    }
}