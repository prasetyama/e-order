CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_SubmitOrderDraft`(
    IN p_filename VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
)
BEGIN
    DECLARE v_new_filename VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    DECLARE v_principal_code VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    DECLARE v_dist_short VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    DECLARE v_order_type_code VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    DECLARE v_periode_code VARCHAR(6) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    DECLARE v_principal VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    DECLARE v_order_type VARCHAR(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    DECLARE v_periode_order VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    DECLARE v_dist_id VARCHAR(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

    -- 1. Get draft record values for building the new filename
    SELECT Principal, OrderType, PeriodeOrder, DistId
    INTO v_principal, v_order_type, v_periode_order, v_dist_id
    FROM eorder.eorder_draforderdistributor
    WHERE FileName = p_filename AND OrderQty > 0
    LIMIT 1;

    -- 2. Map Principal to short code
    --    C  = Ceres (A00703)
    --    NL = PT Nirwana Lestari (add code when available)
    SET v_principal_code = CASE v_principal
        WHEN 'A00703' THEN 'C'
        WHEN 'A00NL1' THEN 'NL'
        ELSE v_principal
    END;

    -- 3. Get DistShort from distributor table
    SELECT DistShort INTO v_dist_short
    FROM eorder.eorder_eorder_distributor
    WHERE DistID = v_dist_id
    LIMIT 1;

    -- 4. Map OrderType to code
    --    U110 = Urgent Order
    SET v_order_type_code = CASE v_order_type
        WHEN '3' THEN 'U110'
        ELSE v_order_type
    END;

    -- 5. Format PeriodeOrder as YYYYMM
    -- SET v_periode_code = DATE_FORMAT(v_periode_order, '%Y%m');

    -- 6. Build new filename: PrincipalCode/DistShort/OrderTypeCode/YYYYMM
    SET v_new_filename = CONCAT(
        v_principal_code, '/',
        IFNULL(v_dist_short, ''), '/',
        v_order_type_code, '/',
        v_periode_order
    );

    -- 7. Move data to final table with the new filename
    INSERT INTO eorder.eorder_eorderdatadtl (
        distid, ponumber, podate, dlvdate, principal, 
        sku, orderqty, uom, stockonhand, filename, 
        order_type, periode, CREATEBY, CREATEDATE,
        release_flag
    )
    SELECT 
        DistId, v_new_filename, RddDate, RddDate, Principal, 
        Sku, OrderQty, UOM, StockOnHand, p_filename, 
        OrderType, PeriodeOrder, CreateBy, CreateDate,
        0
    FROM eorder.eorder_draforderdistributor
    WHERE FileName = p_filename AND OrderQty > 0;

    -- 8. Update Flag in draft table to 1 (SUBMITTED)
    UPDATE eorder.eorder_draforderdistributor 
    SET Flag = 1 
    WHERE FileName = p_filename;
END