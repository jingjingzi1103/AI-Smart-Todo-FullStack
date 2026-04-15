package redlib.backend.model;

import java.util.Date;
import lombok.Data;

/**
 * 描述:todos表的实体类
 * @version
 * @author:  Lenovo
 * @创建时间: 2025-03-25
 */
@Data
public class Todos {
    /**
     * 唯一任务ID
     */
    private Integer id;

    /**
     * 任务标题（最多100字符）
     */
    private String title;

    /**
     * 任务状态
     */
    private String status;

    /**
     * 截止时间（可选）
     */
    private Date dueDate;

    /**
     * 创建时间
     */
    private Date createdAt;

    /**
     * 最后更新时间
     */
    private Date updatedAt;

    /**
     * 详细描述（可选）
     */
    private String description;
}