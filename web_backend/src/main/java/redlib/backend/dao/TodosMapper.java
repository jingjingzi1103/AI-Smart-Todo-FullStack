package redlib.backend.dao;

import org.apache.ibatis.annotations.Param;
import redlib.backend.dto.query.TodosQueryDTO;
import redlib.backend.model.Todos;

import java.util.List;

public interface TodosMapper {
    int deleteByPrimaryKey(Integer id);

    int insert(Todos record);

    int insertSelective(Todos record);

    Todos selectByPrimaryKey(Integer id);

    int updateByPrimaryKeySelective(Todos record);

    int updateByPrimaryKeyWithBLOBs(Todos record);

    int updateByPrimaryKey(Todos record);

    List<Todos> selectByConditions(@Param("title") String title,
                                   @Param("status") String status,
                                   @Param("description") String description,
                                   @Param("dueDate") String dueDate,
                                   @Param("orderByClause") String orderByClause,
                                   @Param("offset") int offset,
                                   @Param("pageSize") int pageSize);

    int countByConditions(TodosQueryDTO queryDTO);

    void deleteByIds(List<Integer> ids);

    /**
     * 根据查询条件获取部门列表
     *
     * @param queryDTO 查询条件
     * @param offset   开始位置
     * @param limit    记录数量
     * @return 部门列表
     */
    List<Todos> list(@Param("queryDTO") TodosQueryDTO queryDTO, @Param("offset") Integer offset, @Param("limit") Integer limit);
}