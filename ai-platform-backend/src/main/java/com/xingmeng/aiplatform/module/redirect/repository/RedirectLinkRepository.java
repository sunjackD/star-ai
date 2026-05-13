package com.xingmeng.aiplatform.module.redirect.repository;

import com.xingmeng.aiplatform.module.redirect.entity.RedirectLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RedirectLinkRepository extends JpaRepository<RedirectLink, Long> {
    List<RedirectLink> findByStatusOrderByCategoryAscSortOrderAscIdAsc(String status);

    List<RedirectLink> findAllByOrderByCategoryAscSortOrderAscIdAsc();
}
