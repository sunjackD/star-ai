package com.xingmeng.aiplatform.module.model.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "ai_models")
public class AiModel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String provider;

    @Column(name = "model_type")
    private String modelType;

    private String capabilities;
    private String pricing;
    private String endpoint;

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getModelType() { return modelType; }
    public void setModelType(String modelType) { this.modelType = modelType; }
    public String getCapabilities() { return capabilities; }
    public void setCapabilities(String capabilities) { this.capabilities = capabilities; }
    public String getPricing() { return pricing; }
    public void setPricing(String pricing) { this.pricing = pricing; }
    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
}

