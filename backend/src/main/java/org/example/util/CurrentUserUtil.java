package org.example.util;

import org.example.entity.Client;
import org.example.repository.ClientRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
public class CurrentUserUtil {

    private final ClientRepository clientRepository;

    public CurrentUserUtil(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    public Client getCurrentClient() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String phone;
        if (principal instanceof UserDetails) {
            phone = ((UserDetails) principal).getUsername();
        } else if (principal instanceof String) {
            phone = (String) principal;
        } else {
            throw new IllegalArgumentException("Неизвестный тип principal: " + principal.getClass().getName());
        }
        return clientRepository.findByPhone(phone)
                .orElseThrow(() -> new IllegalArgumentException("Клиент не найден"));
    }
}