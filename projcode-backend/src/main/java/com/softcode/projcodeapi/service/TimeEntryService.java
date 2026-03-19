package com.softcode.projcodeapi.service;

import com.softcode.projcodeapi.model.TimeEntry;

import java.util.List;
import java.util.Optional;

public interface TimeEntryService {
    List<TimeEntry> getAllTimeEntries();
    List<TimeEntry> getTimeEntriesByTaskId(Long taskId);
    List<TimeEntry> getTimeEntriesByUserId(Long userId);
    List<TimeEntry> getTimeEntriesByTaskIdAndUserId(Long taskId, Long userId);
    Optional<TimeEntry> getTimeEntryById(Long id);
    TimeEntry saveTimeEntry(TimeEntry timeEntry);
    void deleteTimeEntry(Long id);
}
