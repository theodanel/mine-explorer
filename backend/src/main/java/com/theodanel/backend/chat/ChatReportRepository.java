package com.theodanel.backend.chat;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatReportRepository extends JpaRepository<ChatReport, ChatReport.Key> {

	long countByKeyMessageId(Long messageId);
}
