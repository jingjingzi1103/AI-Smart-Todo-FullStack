package redlib.backend.service;

import redlib.backend.dto.TodosDTO;
import redlib.backend.dto.query.TodosQueryDTO;
import redlib.backend.model.Page;
import redlib.backend.vo.TodosVO;


import java.util.List;

public interface TodosService {
    /**
     * 分页查询待办事项
     */
    Page<TodosVO> listByPage(TodosQueryDTO queryDTO);

    /**
     * 新建待办事项
     *
     * @param todosDTO 待办事项输入对象
     * @return 待办事项 ID
     */
    Integer addTodos(TodosDTO todosDTO);

    /**
     * 根据 ID 查询待办事项详情
     *
     * @param id 待办事项 ID
     * @return 待办事项详情
     */
    TodosDTO getById(Integer id);

    /**
     * 更新待办事项数据
     *
     * @param todosDTO 待办事项输入对象
     * @return 待办事项 ID
     */
    Integer updateTodos(TodosDTO todosDTO);

    /**
     * 根据 ID 列表批量删除待办事项
     *
     * @param ids 待办事项 ID 列表
     */
    void deleteByIds(List<Integer> ids);


}
