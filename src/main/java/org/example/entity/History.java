// entity/History.java
package org.example.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class History {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @Column(columnDefinition = "TEXT")
    private String requestDetails; // Детали запроса (например, JSON или описание)

    @Column(columnDefinition = "TEXT")
    private String responseDetails; // Детали ответа (например, JSON результатов)

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}