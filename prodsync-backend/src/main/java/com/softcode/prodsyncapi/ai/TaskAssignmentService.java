package com.softcode.prodsyncapi.ai;

import com.softcode.prodsyncapi.ai.dto.AssignmentRequestDto;
import com.softcode.prodsyncapi.ai.dto.AssignmentResponseDto;
import com.softcode.prodsyncapi.ai.dto.UserPerformanceDto;
import com.softcode.prodsyncapi.service.UserPerformanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskAssignmentService {

    @Autowired
    private UserPerformanceService userPerformanceService;

    @Autowired
    private ClaudeService claudeService;

    public AssignmentResponseDto assignTask(AssignmentRequestDto request) throws Exception {
        List<UserPerformanceDto> profiles = userPerformanceService.getUserPerformanceProfiles();
        if (profiles.isEmpty()) {
            return new AssignmentResponseDto(List.of());
        }
        return claudeService.getTaskAssignment(request, profiles);
    }
}
