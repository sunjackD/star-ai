package com.xingmeng.aiplatform.module.finetune.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "datasets")
public class Dataset {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(name = "file_path")
    private String filePath;

    @Column(name = "record_count")
    private Integer recordCount;

    private String format;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public Integer getRecordCount() { return recordCount; }
    public void setRecordCount(Integer recordCount) { this.recordCount = recordCount; }
    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }
}

