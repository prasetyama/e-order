CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_InitializeOrderDraft`(
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
    DECLARE v_this_week     INT;
    DECLARE v_first_week_no INT;
    DECLARE v_monthname     VARCHAR(25);
    DECLARE v_order_type_code VARCHAR(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

    -- 1. Get current max Id
    SELECT COALESCE(MAX(Id), 0) INTO v_max_id FROM eorder.eorder_draforderdistributor;
    SET v_first_id = v_max_id + 1;

    -- 2. Get WeekNo
    SELECT WeekNo into v_first_week_no from eorder.KALENDAR Where FromDate <= p_po_date AND ToDate >= p_po_date;

    -- 3 Get This Week
    SELECT count(*) into v_this_week from eorder.KALENDAR where PeriodeLabel = (SELECT monthname(p_po_date));

    -- 4. Generate FileName pattern prefix: dist_id + date (YYYYMMDD) + principal + order_type_code
    SET v_order_type_code = CASE p_order_type
        WHEN '3' THEN 'U110'
        WHEN '1' THEN CONCAT('F', v_first_week_no)
        WHEN '2' THEN CONCAT('A', v_first_week_no)
        ELSE p_order_type
    END;
    SET v_now      = DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s');
    SET v_filename = CONCAT(
        TRIM(p_dist_id),
        DATE_FORMAT(NOW(), '%Y%m%d'),
        p_principal,
        v_order_type_code
    );

    -- Check for existing filenames with this prefix and add sequence
    SELECT COUNT(DISTINCT FileName) INTO v_row_num 
    FROM eorder.eorder_draforderdistributor 
    WHERE FileName LIKE CONCAT(v_filename, '%');

    SET v_filename = CONCAT(v_filename, '-', LPAD(v_row_num + 1, 2, '0'));

    -- 5. Insert one row per product for the given principal (OrderQty = 0, ItemPrice = 0)
    INSERT INTO eorder.eorder_draforderdistributor
        (Id, DistId, OrderDate, Principal, PeriodeOrder, OrderType,
         Sku, ProductName, Crt2Plt, OrderQty, This_week, FirstWeek, UOM, ItemPrice,
         StockOnHand, FileName, RddDate, AutoSplit, UseFormula, Flag, CreateBy, CreateDate)
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
        v_this_week,
        v_first_week_no,
        p.BASEUOM,
        0.0000,               -- ItemPrice = 0
        0,
        v_filename,
        p_dlv_date,
        1,					  -- default Auto Split
        0, 					  -- defaul Use Formula
        0,					  -- default FLag
        p_created_by,
        v_now
    FROM eorder.Eorder_ProdMaster p
    JOIN (SELECT @row_num := 0) AS init
    WHERE p.PRINCIPAL = p_principal
    ORDER BY p.Material_Code;

    -- 6. Return the id of the first inserted row so the API can redirect
    SELECT v_first_id AS first_id, v_filename AS filename;
END