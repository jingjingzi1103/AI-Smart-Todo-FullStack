package redlib.backend.vo;

/**
 * Todos 列表返回 VO
 *
 * 时间字段统一使用 ISO 8601 UTC 字符串格式，便于前端使用 moment.utc(...) 做“今日事项”过滤。
 */
public class TodosVO {
    private Integer id;
    private String title;       // 任务标题
    private String description; // 详细描述
    private String status;      // 任务状态（如 pending/completed）
    private String dueDate;     // 截止时间（ISO 8601 UTC 字符串）
    private String createdAt;   // 创建时间（ISO 8601 UTC 字符串）
    private String updatedAt;   // 更新时间（ISO 8601 UTC 字符串）

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

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}