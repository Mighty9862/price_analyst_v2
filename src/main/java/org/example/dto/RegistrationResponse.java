// dto/RegistrationResponse.java
package org.example.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.example.entity.Client;

@Data
@AllArgsConstructor
public class RegistrationResponse {
    private Client client;
    private String token;
}