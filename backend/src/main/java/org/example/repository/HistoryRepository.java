package org.example.repository;

import org.example.entity.History;
import org.example.entity.History;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HistoryRepository extends JpaRepository<History, Long> {
    List<History> findByClientIdOrderByTimestampDesc(Long clientId);
    List<History> findByHistoryTypeOrderByTimestampDesc(History.HistoryType historyType);
}