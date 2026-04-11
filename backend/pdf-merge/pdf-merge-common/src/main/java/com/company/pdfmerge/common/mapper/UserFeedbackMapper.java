package com.company.pdfmerge.common.mapper;

import com.company.pdfmerge.common.entity.UserFeedbackEntity;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserFeedbackMapper {

    int insert(UserFeedbackEntity row);
}
