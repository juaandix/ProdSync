package com.softcode.projcodeapi.service;

import com.softcode.projcodeapi.model.TimeEntry;
import com.softcode.projcodeapi.repository.TimeEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TimeEntryServiceImpl implements TimeEntryService {

    @Autowired
    private TimeEntryRepository timeEntryRepository;

    @Override
    public List<TimeEntry> getAllTimeEntries() {
        return timeEntryRepository.findAll();
    }

    @Override
    public List<TimeEntry> getTimeEntriesByTaskId(Long taskId) {
        return timeEntryRepository.findByTask_Id(taskId);
    }

    @Override
    public List<TimeEntry> getTimeEntriesByUserId(Long userId) {
        return timeEntryRepository.findByUser_Id(userId);
    }

    @Override
    public List<TimeEntry> getTimeEntriesByTaskIdAndUserId(Long taskId, Long userId) {
        return timeEntryRepository.findByTask_IdAndUser_Id(taskId, userId);
    }

    @Override
    public Optional<TimeEntry> getTimeEntryById(Long id) {
        return timeEntryRepository.findById(id);
    }

    @Override
    public TimeEntry saveTimeEntry(TimeEntry timeEntry) {
        return timeEntryRepository.save(timeEntry);
    }

    @Override
    public void deleteTimeEntry(Long id) {
        timeEntryRepository.deleteById(id);
    }
}
