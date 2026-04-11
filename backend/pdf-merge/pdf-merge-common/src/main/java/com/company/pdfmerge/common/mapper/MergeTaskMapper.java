package com.company.pdfmerge.common.mapper;

import com.company.pdfmerge.common.entity.MergeTaskEntity;
import java.time.LocalDateTime;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface MergeTaskMapper {

    int insert(MergeTaskEntity row);

    int update(MergeTaskEntity row);

    int updateMergeProgress(@Param("taskId") String taskId,
                            @Param("mergeProgressDone") int mergeProgressDone,
                            @Param("mergeProgressIndex") Integer mergeProgressIndex,
                            @Param("mergeProgressName") String mergeProgressName,
                            @Param("updatedAt") LocalDateTime updatedAt);

    MergeTaskEntity selectByTaskId(@Param("taskId") String taskId);

    MergeTaskEntity selectByTaskIdAndOwnerId(@Param("taskId") String taskId, @Param("ownerId") String ownerId);
}
