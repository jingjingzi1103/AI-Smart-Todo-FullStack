package redlib.backend.service.impl;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import redlib.backend.dao.TodosMapper;
import redlib.backend.dto.TodosDTO;
import redlib.backend.dto.query.TodosQueryDTO;
import redlib.backend.model.Page;
import redlib.backend.model.Todos;
import redlib.backend.service.TodosService;
import redlib.backend.utils.FormatUtils;
import redlib.backend.utils.PageUtils;
import redlib.backend.vo.TodosVO;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TodosServiceImpl implements TodosService {
    @Autowired
    private TodosMapper todosMapper;

    @Override
    public Page<TodosVO> listByPage(TodosQueryDTO queryDTO) {
        // 1. 参数校验与默认值设置
        if (queryDTO == null) {
            queryDTO = new TodosQueryDTO();
        }

        // 标题模糊查询
        queryDTO.setTitle(FormatUtils.makeFuzzySearchTerm(queryDTO.getTitle()));

        // 解析排序字段，转换为安全的 SQL 片段
        String orderByClause = buildOrderByClause(queryDTO.getOrderBy());

        // 2. 查询总数
        int total = todosMapper.countByConditions(queryDTO);

        // 3. 初始化分页工具类
        PageUtils pageUtils = new PageUtils(queryDTO.getCurrent(), queryDTO.getPageSize(), total);

        // 如果没有记录，则返回空分页结果
        if (total == 0) {
            return pageUtils.getNullPage();
        }

        // 4. 查询分页数据（LIMIT 使用 offset = (current - 1) * pageSize）
        List<Todos> todosList = todosMapper.selectByConditions(
                queryDTO.getTitle(),
                queryDTO.getStatus(),
                queryDTO.getDescription(),
                queryDTO.getDueDate(),
                orderByClause,
                pageUtils.getOffset(),
                pageUtils.getLimit()
        );


        // 5. 转换为 VO 列表（时间字段统一转为 ISO 8601 UTC 字符串）
        List<TodosVO> vos = todosList.stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        // 6. 返回分页结果
        return new Page<>(pageUtils.getCurrent(), pageUtils.getPageSize(), pageUtils.getTotal(), vos);
    }

    @Override
    @Transactional
    public Integer addTodos(TodosDTO todosDTO) {
        // 1. 参数校验
        if (todosDTO == null) {
            throw new IllegalArgumentException("参数不能为空");
        }

        // 2. DTO 转实体
        Todos todo = convertToEntity(todosDTO);

        // 3. 插入数据库
        todosMapper.insert(todo);

        // 4. 返回生成的 ID
        return todo.getId();
    }

    @Override
    public TodosDTO getById(Integer id) {
        // 1. 校验 ID
        if (id == null || id <= 0) {
            throw new IllegalArgumentException("ID不合法");
        }

        // 2. 查询数据库
        Todos todo = todosMapper.selectByPrimaryKey(id);
        if (todo == null) {
            throw new RuntimeException("待办事项不存在");
        }

        // 3. 实体转 DTO
        return convertToDTO(todo);
    }

    @Override
    @Transactional
    public Integer updateTodos(TodosDTO todosDTO) {
        // 1. 校验参数
        if (todosDTO == null || todosDTO.getId() == null) {
            throw new IllegalArgumentException("参数不合法");
        }

        // 2. 检查是否存在
        Todos existing = todosMapper.selectByPrimaryKey(todosDTO.getId());
        if (existing == null) {
            throw new RuntimeException("待办事项不存在");
        }

        // 3. DTO 转实体
        Todos todo = convertToEntity(todosDTO);

        // 4. 更新数据库
        todosMapper.updateByPrimaryKey(todo);

        return todo.getId();
    }

    @Override
    @Transactional
    public void deleteByIds(List<Integer> ids) {
        // 1. 校验 ID 列表
        if (ids == null || ids.isEmpty()) {
            throw new IllegalArgumentException("ID列表不能为空");
        }

        // 2. 批量删除
        todosMapper.deleteByIds(ids);
    }

    // 辅助方法：DTO 转实体
    private Todos convertToEntity(TodosDTO dto) {
        Todos todo = new Todos();
        BeanUtils.copyProperties(dto, todo);
        return todo;
    }

    // 辅助方法：实体转 DTO
    private TodosDTO convertToDTO(Todos entity) {
        TodosDTO dto = new TodosDTO();
        BeanUtils.copyProperties(entity, dto);
        return dto;
    }

    // 辅助方法：实体转 VO
    private TodosVO convertToVO(Todos entity) {
        TodosVO vo = new TodosVO();
        BeanUtils.copyProperties(entity, vo);

        // 手动处理时间字段：转换为 ISO 8601 UTC 字符串
        DateTimeFormatter isoFormatter = DateTimeFormatter.ISO_INSTANT;
        if (entity.getDueDate() != null) {
            Instant instant = entity.getDueDate().toInstant();
            vo.setDueDate(isoFormatter.format(instant.atOffset(ZoneOffset.UTC)));
        }
        if (entity.getCreatedAt() != null) {
            Instant instant = entity.getCreatedAt().toInstant();
            vo.setCreatedAt(isoFormatter.format(instant.atOffset(ZoneOffset.UTC)));
        }
        if (entity.getUpdatedAt() != null) {
            Instant instant = entity.getUpdatedAt().toInstant();
            vo.setUpdatedAt(isoFormatter.format(instant.atOffset(ZoneOffset.UTC)));
        }

        return vo;
    }

    /**
     * 解析前端传入的 orderBy（如 "createdAt desc"），并转换为安全的 SQL 片段：
     * - 仅允许特定字段：id/title/status/dueDate/createdAt/updatedAt
     * - 方向仅允许 ASC / DESC
     */
    private String buildOrderByClause(String orderBy) {
        if (!StringUtils.hasText(orderBy)) {
            // 默认按 id 升序
            return "id ASC";
        }

        String[] parts = orderBy.trim().split("\\s+");
        if (parts.length == 0) {
            return "id ASC";
        }

        String property = parts[0];
        String direction = parts.length > 1 ? parts[1] : "asc";

        // 允许的字段映射到实际数据库列名
        String column;
        switch (property) {
            case "id":
                column = "id";
                break;
            case "title":
                column = "title";
                break;
            case "status":
                column = "status";
                break;
            case "dueDate":
                column = "due_date";
                break;
            case "createdAt":
                column = "created_at";
                break;
            case "updatedAt":
                column = "updated_at";
                break;
            default:
                // 非法字段直接退回默认排序，避免 SQL 注入
                return "id ASC";
        }

        String upperDir = direction.toUpperCase();
        if (!"ASC".equals(upperDir) && !"DESC".equals(upperDir)) {
            upperDir = "ASC";
        }

        return column + " " + upperDir;
    }
}
