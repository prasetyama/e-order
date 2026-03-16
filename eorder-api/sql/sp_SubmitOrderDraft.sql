CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_SubmitOrderDraft`(
    IN p_filename VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
)
BEGIN
    DECLARE v_principal_code VARCHAR(10);
    DECLARE v_dist_short VARCHAR(10);
    DECLARE v_periode_order VARCHAR(10);
    DECLARE v_dist_id VARCHAR(10);
    DECLARE v_order_type VARCHAR(45);
    DECLARE v_principal VARCHAR(10);
    DECLARE v_month_str VARCHAR(7);
    DECLARE v_urgent_running_no INT DEFAULT 0;

    -- 1. Get metadata from draft
    SELECT Principal, OrderType, PeriodeOrder, DistId
    INTO v_principal, v_order_type, v_periode_order, v_dist_id
    FROM eorder.eorder_draforderdistributor
    WHERE FileName = p_filename AND OrderQty > 0
    LIMIT 1;

    -- 2. Map Principal to short code
    SET v_principal_code = CASE v_principal
        WHEN 'A00703' THEN 'C'
        WHEN 'A00NL1' THEN 'NL'
        ELSE v_principal
    END;

    -- 3. Get DistShort
    SELECT DistShort INTO v_dist_short
    FROM eorder.eorder_eorder_distributor
    WHERE CAST(DistID AS UNSIGNED) = CAST(v_dist_id AS UNSIGNED)
    LIMIT 1;

    -- 4. Urgent Order Running Number (Type 3)
    IF v_order_type = '3' THEN
        SET v_month_str = DATE_FORMAT(NOW(), '%Y-%m');
        
        -- Count unique Urgent POs for this distributor in the current month
        -- Using LIKE for ponumber pattern matching with collation fix
        SELECT COUNT(DISTINCT ponumber) INTO v_urgent_running_no
        FROM eorder.eorder_eorderdatadtl
        WHERE distid = v_dist_id COLLATE utf8mb4_general_ci
          AND order_type = '3' COLLATE utf8mb4_general_ci
          AND podate LIKE CONCAT(v_month_str, '%') COLLATE utf8mb4_general_ci;
    END IF;

    -- 5. Insert with dynamic PO Numbering and Splitting
    
    -- TYPE 1: Regular Order - Split by Week
    IF v_order_type = '1' THEN
        INSERT INTO eorder.eorder_eorderdatadtl (
            distid, ponumber, podate, dlvdate, principal, 
            sku, orderqty, uom, stockonhand, filename, 
            order_type, periode, CREATEBY, CREATEDATE,
            release_flag
        )
        SELECT 
            d.DistId,
            CONCAT(v_principal_code, '/', IFNULL(v_dist_short, ''), '/F', LPAD(k.WeekNo, 3, '00'), '/', v_periode_order) as ponumber,
            k.ToDate, k.ToDate, d.Principal, 
            d.Sku, d.OrderQty, d.UOM, d.StockOnHand, p_filename, 
            d.OrderType, d.PeriodeOrder, d.CreateBy, d.CreateDate,
            0
        FROM eorder.eorder_draforderdistributor d
        -- Join with KALENDAR on the period (RddDate for Type 1 might be YYYYMM or YYYY-MM)
        JOIN eorder.KALENDAR k ON REPLACE(d.RddDate, '-', '') = k.Periode
        WHERE d.FileName = p_filename AND d.OrderQty > 0;

    -- TYPE 2: Additional Order - Range to WeekNo
    ELSEIF v_order_type = '2' THEN
        INSERT INTO eorder.eorder_eorderdatadtl (
            distid, ponumber, podate, dlvdate, principal, 
            sku, orderqty, uom, stockonhand, filename, 
            order_type, periode, CREATEBY, CREATEDATE,
            release_flag
        )
        SELECT 
            d.DistId,
            CONCAT(v_principal_code, '/', IFNULL(v_dist_short, ''), '/A', LPAD(k.WeekNo, 3, '00'), '/', v_periode_order) as ponumber,
            -- Use the end of the range for delivery date
            STR_TO_DATE(SUBSTRING_INDEX(d.RddDate, ' - ', -1), '%Y-%m-%d'),
            STR_TO_DATE(SUBSTRING_INDEX(d.RddDate, ' - ', -1), '%Y-%m-%d'),
            d.Principal, 
            d.Sku, d.OrderQty, d.UOM, d.StockOnHand, p_filename, 
            d.OrderType, d.PeriodeOrder, d.CreateBy, d.CreateDate,
            0
        FROM eorder.eorder_draforderdistributor d
        -- Get WeekNo using the first date in the range
        JOIN eorder.KALENDAR k ON STR_TO_DATE(SUBSTRING_INDEX(d.RddDate, ' - ', 1), '%Y-%m-%d') BETWEEN k.FromDate AND k.ToDate
        WHERE d.FileName = p_filename AND d.OrderQty > 0;

    -- TYPE 3 & Others: Urgent or Default
    ELSE
        INSERT INTO eorder.eorder_eorderdatadtl (
            distid, ponumber, podate, dlvdate, principal, 
            sku, orderqty, uom, stockonhand, filename, 
            order_type, periode, CREATEBY, CREATEDATE,
            release_flag
        )
        SELECT 
            d.DistId,
            CASE d.OrderType
                WHEN '3' THEN 
                    CONCAT(v_principal_code, '/', IFNULL(v_dist_short, ''), '/U', LPAD(v_urgent_running_no + 1, 3, '00'), '/', v_periode_order)
                ELSE 
                    CONCAT(v_principal_code, '/', IFNULL(v_dist_short, ''), '/', d.OrderType, '/', v_periode_order)
            END as ponumber,
            d.RddDate, d.RddDate, d.Principal, 
            d.Sku, d.OrderQty, d.UOM, d.StockOnHand, p_filename, 
            d.OrderType, d.PeriodeOrder, d.CreateBy, d.CreateDate,
            0
        FROM eorder.eorder_draforderdistributor d
        WHERE d.FileName = p_filename AND d.OrderQty > 0;
    END IF;

    -- 6. Update Flag in draft table to 1 (SUBMITTED)
    UPDATE eorder.eorder_draforderdistributor 
    SET Flag = 1 
    WHERE FileName = p_filename COLLATE utf8mb4_general_ci;
END