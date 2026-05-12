CREATE TABLE permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(120) NOT NULL UNIQUE,
    resource VARCHAR(80) NOT NULL,
    action VARCHAR(80) NOT NULL,
    description VARCHAR(300) NOT NULL
);

CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles (id),
    CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions (id)
);

INSERT INTO permissions (code, resource, action, description)
VALUES
('admin:users:manage', 'users', 'manage', '管理用户、状态、角色和密码'),
('admin:resources:manage', 'resources', 'manage', '管理 Agents、Skills、模型、微调、链接等资源'),
('admin:audit:read', 'audit_logs', 'read', '查看平台审计日志'),
('developer:skills:manage', 'skills', 'manage', '通过自管理 Skill 管理站内 Skills');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON r.name = 'ADMIN';
