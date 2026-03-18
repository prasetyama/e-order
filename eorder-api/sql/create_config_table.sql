CREATE TABLE IF NOT EXISTS eorder_config (
    config_key VARCHAR(50) PRIMARY KEY,
    config_value VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO eorder_config (config_key, config_value, description) 
VALUES 
('order_split_max_qty', '250', 'Maximum quantity per weekly shipment')
ON DUPLICATE KEY UPDATE config_value = '250';

INSERT INTO eorder_config (config_key, config_value, description) 
VALUES 
('order_split_mode', 'ALL', 'Split mode: ALL (all weeks) or ODD_ONLY (weeks 1 & 3)')
ON DUPLICATE KEY UPDATE config_value = 'ALL';
