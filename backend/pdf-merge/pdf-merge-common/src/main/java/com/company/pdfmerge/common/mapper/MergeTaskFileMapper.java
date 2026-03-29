package com.company.pdfmerge.common.mapper;

import com.company.pdfmerge.common.entity.MergeTaskFileEntity;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface MergeTaskFileMapper {

    int insert(MergeTaskFileEntity row);

    int insertBatch(@Param("list") List<MergeTaskFileEntity> list);

    List<MergeTaskFileEntity> selectByTaskIdOrderByOrderIndexAsc(@Param("taskId") String taskId);
}
