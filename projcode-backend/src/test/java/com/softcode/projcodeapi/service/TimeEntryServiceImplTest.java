package com.softcode.projcodeapi.service;

import com.softcode.projcodeapi.model.TimeEntry;
import com.softcode.projcodeapi.repository.TimeEntryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TimeEntryServiceImplTest {

    @Mock
    private TimeEntryRepository timeEntryRepository;

    @InjectMocks
    private TimeEntryServiceImpl timeEntryService;

    @Test
    void getAllTimeEntries_shouldReturnAll() {
        TimeEntry entry = new TimeEntry();
        entry.setId(1L);
        when(timeEntryRepository.findAll()).thenReturn(List.of(entry));

        List<TimeEntry> result = timeEntryService.getAllTimeEntries();

        assertEquals(1, result.size());
    }

    @Test
    void getTimeEntriesByTaskId_shouldReturnFiltered() {
        TimeEntry entry = new TimeEntry();
        entry.setId(1L);
        when(timeEntryRepository.findByTask_Id(5L)).thenReturn(List.of(entry));

        List<TimeEntry> result = timeEntryService.getTimeEntriesByTaskId(5L);

        assertEquals(1, result.size());
        verify(timeEntryRepository).findByTask_Id(5L);
    }

    @Test
    void getTimeEntryById_shouldReturnEntry_whenFound() {
        TimeEntry entry = new TimeEntry();
        entry.setId(1L);
        entry.setDescription("Work done");
        when(timeEntryRepository.findById(1L)).thenReturn(Optional.of(entry));

        Optional<TimeEntry> result = timeEntryService.getTimeEntryById(1L);

        assertTrue(result.isPresent());
        assertEquals("Work done", result.get().getDescription());
    }

    @Test
    void saveTimeEntry_shouldReturnSaved() {
        TimeEntry entry = new TimeEntry();
        entry.setDescription("New entry");
        when(timeEntryRepository.save(entry)).thenReturn(entry);

        TimeEntry result = timeEntryService.saveTimeEntry(entry);

        assertEquals("New entry", result.getDescription());
    }

    @Test
    void getTimeEntriesByTaskIdAndUserId_shouldReturnFiltered() {
        TimeEntry entry = new TimeEntry();
        entry.setId(1L);
        when(timeEntryRepository.findByTask_IdAndUser_Id(5L, 2L)).thenReturn(List.of(entry));

        List<TimeEntry> result = timeEntryService.getTimeEntriesByTaskIdAndUserId(5L, 2L);

        assertEquals(1, result.size());
        verify(timeEntryRepository).findByTask_IdAndUser_Id(5L, 2L);
    }

    @Test
    void deleteTimeEntry_shouldCallRepository() {
        timeEntryService.deleteTimeEntry(1L);
        verify(timeEntryRepository).deleteById(1L);
    }
}
