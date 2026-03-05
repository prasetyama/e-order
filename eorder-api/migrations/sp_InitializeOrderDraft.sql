-- Migration: Create stored procedure sp_InitializeOrderDraft
-- Run this once against the eorder database.

DROP PROCEDURE IF EXISTS eorder.sp_InitializeOrderDraft;

DELIMITER $$

CREATE PROCEDURE eorder.sp_InitializeOrderDraft(
    IN p_dist_id    CHAR(10),
    IN p_principal  VARCHAR(6),
    IN p_order_type VARCHAR(20),
    IN p_periode    VARCHAR(20),
    IN p_po_date    VARCHAR(50),
    IN p_dlv_date   VARCHAR(50),
    IN p_created_by VARCHAR(50)
)
BEGIN
    DECLARE v_max_id        INT;
    DECLARE v_filename      VARCHAR(50);
    DECLARE v_now           VARCHAR(50);
    DECLARE v_first_id      INT;
    DECLARE v_row_num       INT DEFAULT 0;

    -- 1. Generate FileName pattern: dist_id + period date (YYYYMMDD) + principal short code
    SET v_now      = DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s');
    SET v_filename = CONCAT(
        TRIM(p_dist_id),
        DATE_FORMAT(NOW(), '%Y%m%d'),
        REPLACE(TRIM(p_principal), 'A00', '')
    );

    -- 2. Get current max Id
    SELECT COALESCE(MAX(Id), 0) INTO v_max_id FROM eorder.eorder_draforderdistributor;
    SET v_first_id = v_max_id + 1;

    -- 3. Insert one row per product for the given principal (OrderQty = 0, ItemPrice = 0)
    INSERT INTO eorder.eorder_draforderdistributor
        (Id, DistId, OrderDate, Principal, PeriodeOrder, OrderType,
         Sku, ProductName, Crt2Plt, OrderQty, UOM, ItemPrice,
         StockOnHand, FileName, RddDate, CreateBy, CreateDate)
    SELECT
        v_max_id + (@row_num := @row_num + 1),
        p_dist_id,
        p_po_date,
        p_principal,
        p_periode,
        p_order_type,
        p.Material_Code,
        p.Material_Description,
        p.CRT2PLT,
        0,                    -- OrderQty = 0
        p.BASEUOM,
        0.0000,               -- ItemPrice = 0
        0,
        v_filename,
        p_dlv_date,
        p_created_by,
        v_now
    FROM eorder.Eorder_ProdMaster p
    JOIN (SELECT @row_num := 0) AS init
    WHERE p.PRINCIPAL = p_principal
    ORDER BY p.Material_Code;

    -- 4. Return the id of the first inserted row so the API can redirect
    SELECT v_first_id AS first_id, v_filename AS filename;
END$$

DELIMITER ;
