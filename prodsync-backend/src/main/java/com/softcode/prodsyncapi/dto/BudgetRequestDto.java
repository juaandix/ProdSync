package com.softcode.prodsyncapi.dto;

import com.softcode.prodsyncapi.model.BudgetLine;
import lombok.Data;

import java.util.List;

@Data
public class BudgetRequestDto {
    private String numero;
    private String title;
    private Long clientId;
    private Long projectId;
    private String status;
    private String createdAt;
    private String validUntil;
    private List<BudgetLine> lines;
    private String notes;
}
