package com.softcode.prodsyncapi.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "time_entries")
public class TimeEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    @JsonIgnore
    private Task task;

    @NotBlank(message = "La fecha es obligatoria")
    @Column(name = "entry_date")
    private String date;

    @NotNull(message = "Las horas son obligatorias")
    @Min(value = 0, message = "Las horas no pueden ser negativas")
    @Column(name = "hours")
    private Double hours;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "entry_type")
    private String type;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @JsonProperty("taskId")
    public Long getTaskId() {
        return task != null ? task.getId() : null;
    }

    @JsonProperty("taskId")
    public void setTaskId(Long taskId) {
        if (taskId != null) {
            Task t = new Task();
            t.setId(taskId);
            this.task = t;
        }
    }

    @JsonProperty("userId")
    public Long getUserId() {
        return user != null ? user.getId() : null;
    }

    @JsonProperty("userId")
    public void setUserId(Long userId) {
        if (userId != null) {
            User u = new User();
            u.setId(userId);
            this.user = u;
        }
    }
}
