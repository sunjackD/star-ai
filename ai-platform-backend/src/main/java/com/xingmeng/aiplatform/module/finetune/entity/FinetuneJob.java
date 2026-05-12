package com.xingmeng.aiplatform.module.finetune.entity;

import com.xingmeng.aiplatform.common.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "finetune_jobs")
public class FinetuneJob extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(name = "base_model")
    private String baseModel;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dataset_id")
    private Dataset dataset;

    private String status;
    private Integer progress;

    @Column(name = "config_json")
    private String configJson;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getBaseModel() { return baseModel; }
    public void setBaseModel(String baseModel) { this.baseModel = baseModel; }
    public Dataset getDataset() { return dataset; }
    public void setDataset(Dataset dataset) { this.dataset = dataset; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Integer getProgress() { return progress; }
    public void setProgress(Integer progress) { this.progress = progress; }
    public String getConfigJson() { return configJson; }
    public void setConfigJson(String configJson) { this.configJson = configJson; }
}

