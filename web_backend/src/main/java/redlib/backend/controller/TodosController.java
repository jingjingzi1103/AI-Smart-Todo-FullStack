package redlib.backend.controller;


import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import redlib.backend.annotation.BackendModule;
import redlib.backend.annotation.Privilege;
import redlib.backend.dao.TodosMapper;
import redlib.backend.dto.TodosDTO;
import redlib.backend.dto.query.TodosQueryDTO;
import redlib.backend.model.Page;
import redlib.backend.model.ResponseData;
import redlib.backend.model.Todos;
import redlib.backend.service.AiService;
import redlib.backend.service.TodosService;
import redlib.backend.vo.TodosVO;

import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/todos")
@BackendModule ({"page:页面", "update:修改", "add:创建", "delete:删除"})
public class TodosController {

    @Autowired
    private TodosService todosService;

    @Autowired
    private AiService aiService;

    @Autowired
    private TodosMapper todosMapper;

    /**
     * 分页查询待办事项
     *
     * @param queryDTO 查询条件对象
     * @return 分页结果
     */
    @PostMapping("listTodos")
    @Privilege("page")
    public Page<TodosVO> listTodos(@RequestBody TodosQueryDTO queryDTO) {
        return todosService.listByPage(queryDTO);
    }

    /**
     * 新增待办事项
     *
     * @param todosDTO 待办事项输入对象
     * @return 新增的待办事项 ID
     */
    @PostMapping("addTodos")
    @Privilege("add")
    public Integer addTodos(@RequestBody TodosDTO todosDTO) {
        return todosService.addTodos(todosDTO);
    }

    /**
     * 更新待办事项
     *
     * @param todosDTO 待办事项输入对象
     * @return 更新后的待办事项 ID
     */
    @PostMapping("updateTodos")
    @Privilege("update")
    public Integer updateTodos(@RequestBody TodosDTO todosDTO) {
        return todosService.updateTodos(todosDTO);
    }

    /**
     * 根据 ID 查询待办事项详情
     *
     * @param id 待办事项 ID
     * @return 待办事项详情
     */
    @GetMapping("getTodos")
    @Privilege("update")
    public TodosDTO getTodos(Integer id) {
        return todosService.getById(id);
    }

    /**
     * 批量删除待办事项
     *
     * @param ids 待办事项 ID 列表
     */
    @PostMapping("deleteTodos")
    @Privilege("delete")
    public void deleteTodos(@RequestBody List<Integer> ids) {
        todosService.deleteByIds(ids);
    }

    /**
     * 使用 AI 解析自然语言并创建待办事项
     */
    @PostMapping("ai-create")
    @Privilege("add")
    @Operation(summary = "AI 创建待办事项")
    public ResponseData<Void> aiCreate(@RequestBody Map<String, String> body) {
        String text = body.get("text");
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("text 不能为空");
        }

        // 1. 调用 AI 解析为 Todos 对象
        Todos todo = aiService.parseTask(text);

        // 2. 设置默认值
        Date now = new Date();
        todo.setStatus("pending");
        if (todo.getCreatedAt() == null) {
            todo.setCreatedAt(now);
        }
        todo.setUpdatedAt(now);

        // 3. 存入数据库
        todosMapper.insert(todo);

        // 4. 返回标准成功结果
        ResponseData<Void> resp = new ResponseData<>();
        resp.setCode(200);
        resp.setSuccess(true);
        resp.setMessage("success");
        return resp;
    }

    /**
     * AI 拆解任务为子任务
     */
    @PostMapping("{id}/breakdown")
    @Privilege("add")
    @Operation(summary = "AI 拆解任务为子任务")
    public ResponseData<Void> breakdown(@PathVariable("id") Integer id) {
        // 1. 查询父任务
        Todos parent = todosMapper.selectByPrimaryKey(id);
        if (parent == null) {
            throw new IllegalArgumentException("任务不存在，id=" + id);
        }

        // 2. 调用 AI 拆解
        List<Todos> children = aiService.breakdownTask(parent.getTitle(), parent.getDescription());

        // 3. 设置默认值并保存子任务
        Date now = new Date();
        for (Todos child : children) {
            child.setStatus("pending");
            child.setDueDate(parent.getDueDate());
            child.setCreatedAt(now);
            child.setUpdatedAt(now);
            todosMapper.insert(child);
        }

        ResponseData<Void> resp = new ResponseData<>();
        resp.setCode(200);
        resp.setSuccess(true);
        resp.setMessage("success");
        return resp;
    }


}
