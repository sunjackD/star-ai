DELETE FROM finetune_jobs
WHERE name = '客服助手微调'
  AND base_model = 'gpt-oss-20b'
  AND status = 'RUNNING'
  AND progress = 42;

DELETE FROM datasets
WHERE name = '客服问答样例'
  AND file_path = '/uploads/datasets/support-sample.jsonl'
  AND NOT EXISTS (
      SELECT 1
      FROM finetune_jobs
      WHERE finetune_jobs.dataset_id = datasets.id
  );
