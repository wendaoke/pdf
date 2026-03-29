package com.company.pdfmerge.common.mapper;

import com.company.pdfmerge.common.entity.MergeTaskEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface MergeTaskMapper {

    int insert(MergeTaskEntity row);

    int update(MergeTaskEntity row);

    MergeTaskEntity selectByTaskId(@Param("taskId") String taskId);

    MergeTaskEntity selectByTaskIdAndOwnerId(@Param("taskId") String taskId, @Param("ownerId") String ownerId);
}
