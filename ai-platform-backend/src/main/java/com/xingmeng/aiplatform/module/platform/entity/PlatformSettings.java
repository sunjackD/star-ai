package com.xingmeng.aiplatform.module.platform.entity;

import com.xingmeng.aiplatform.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "platform_settings")
public class PlatformSettings extends BaseEntity {
    @Id
    private Long id;

    @Column(name = "site_name", nullable = false, length = 120)
    private String siteName;

    @Column(name = "site_subtitle", nullable = false, length = 255)
    private String siteSubtitle;

    @Column(name = "default_theme", nullable = false, length = 64)
    private String defaultTheme;

    @Column(name = "allow_public_registration", nullable = false)
    private boolean allowPublicRegistration;

    @Column(name = "default_user_role", nullable = false, length = 64)
    private String defaultUserRole;

    @Column(name = "api_key_default_expire_days", nullable = false)
    private int apiKeyDefaultExpireDays;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSiteName() {
        return siteName;
    }

    public void setSiteName(String siteName) {
        this.siteName = siteName;
    }

    public String getSiteSubtitle() {
        return siteSubtitle;
    }

    public void setSiteSubtitle(String siteSubtitle) {
        this.siteSubtitle = siteSubtitle;
    }

    public String getDefaultTheme() {
        return defaultTheme;
    }

    public void setDefaultTheme(String defaultTheme) {
        this.defaultTheme = defaultTheme;
    }

    public boolean isAllowPublicRegistration() {
        return allowPublicRegistration;
    }

    public void setAllowPublicRegistration(boolean allowPublicRegistration) {
        this.allowPublicRegistration = allowPublicRegistration;
    }

    public String getDefaultUserRole() {
        return defaultUserRole;
    }

    public void setDefaultUserRole(String defaultUserRole) {
        this.defaultUserRole = defaultUserRole;
    }

    public int getApiKeyDefaultExpireDays() {
        return apiKeyDefaultExpireDays;
    }

    public void setApiKeyDefaultExpireDays(int apiKeyDefaultExpireDays) {
        this.apiKeyDefaultExpireDays = apiKeyDefaultExpireDays;
    }
}
