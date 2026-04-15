package redlib.backend.dto.query;

/**
 * Todos 列表查询 DTO
 *
 * 对应前端 Ant Design ProTable 的查询参数：
 * - current: 当前页码（从 1 开始）
 * - pageSize: 每页条数
 * - title/status/description: 模糊 / 精确查询字段
 * - dueDate: 截止时间字符串，格式 yyyy-MM-dd HH:mm:ss（用户本地时间）
 * - orderBy: 排序字段字符串，如 "createdAt desc"
 */
public class TodosQueryDTO {
    /**
     * 当前页码（从 1 开始）
     */
    private Integer current;

    /**
     * 每页记录数
     */
    private Integer pageSize;

    /**
     * 任务标题（模糊查询）
     */
    private String title;

    /**
     * 任务状态（如 pending/completed）
     */
    private String status;

    /**
     * 描述（模糊查询）
     */
    private String description;

    /**
     * 截止时间筛选字符串，格式：yyyy-MM-dd HH:mm:ss（用户本地时间）
     */
    private String dueDate;

    /**
     * 排序字段，如：createdAt desc
     */
    private String orderBy;

    // Getters and Setters
    public Integer getCurrent() {
        return current;
    }

    public void setCurrent(Integer current) {
        this.current = current;
    }

    public Integer getPageSize() {
        return pageSize;
    }

    public void setPageSize(Integer pageSize) {
        this.pageSize = pageSize;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public String getOrderBy() {
        return orderBy;
    }

    public void setOrderBy(String orderBy) {
        this.orderBy = orderBy;
    }
}
