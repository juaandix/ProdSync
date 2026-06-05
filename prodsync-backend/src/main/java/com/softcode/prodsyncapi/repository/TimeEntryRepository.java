package com.softcode.prodsyncapi.repository;

import com.softcode.prodsyncapi.model.TimeEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimeEntryRepository extends JpaRepository<TimeEntry, Long> {
    List<TimeEntry> findByTask_Id(Long taskId);
    List<TimeEntry> findByUser_Id(Long userId);
    List<TimeEntry> findByTask_IdAndUser_Id(Long taskId, Long userId);
}
