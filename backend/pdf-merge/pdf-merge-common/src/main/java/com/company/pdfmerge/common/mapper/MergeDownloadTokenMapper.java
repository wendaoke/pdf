package com.company.pdfmerge.common.mapper;

import com.company.pdfmerge.common.entity.MergeDownloadTokenEntity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface MergeDownloadTokenMapper {

    int insert(MergeDownloadTokenEntity row);

    int update(MergeDownloadTokenEntity row);

    MergeDownloadTokenEntity selectByTokenAndTaskIdAndOwnerId(
            @Param("token") String token,
            @Param("taskId") String taskId,
            @Param("ownerId") String ownerId);
}
