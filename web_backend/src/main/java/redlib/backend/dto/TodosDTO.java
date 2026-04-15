package redlib.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.util.Date;

public class TodosDTO {
    private Integer id; // 主键 ID（可选，用于更新操作）
    private String title; // 任务标题
    private String description; // 详细描述
    private String status; // 任务状态（如 pending/completed）
    @JsonFormat(shape = JsonFormat.Shape.STRING,
            pattern = "yyyy-MM-dd HH:mm:ss",
            timezone = "Asia/Shanghai")
    private Date dueDate; // 截止时间

    // Getters and Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Date getDueDate() {
        return dueDate;
    }

    public void setDueDate(Date dueDate) {
        this.dueDate = dueDate;
    }

}
