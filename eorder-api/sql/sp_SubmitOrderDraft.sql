CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_SubmitOrderDraft`(
    IN p_filename VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
)
BEGIN
    -- Move data to final table
    INSERT INTO eorder.eorder_eorderdatadtl (
        distid, ponumber, podate, dlvdate, principal, 
        sku, orderqty, uom, stockonhand, filename, 
        order_type, periode, CREATEBY, CREATEDATE,
        release_flag
    )
    SELECT 
        DistId, FileName, OrderDate, OrderDate, Principal, 
        Sku, OrderQty, UOM, StockOnHand, FileName, 
        OrderType, PeriodeOrder, CreateBy, CreateDate,
        0
    FROM eorder.eorder_draforderdistributor
    WHERE FileName = p_filename AND OrderQty > 0;

    -- Update Flag in draft table to 1 (SUBMITTED)
    UPDATE eorder.eorder_draforderdistributor 
    SET Flag = 1 
    WHERE FileName = p_filename;
END