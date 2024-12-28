use mysql::{params, prelude::Queryable};
use tauri::State;

use crate::model::{ReportDetail, ReportHeader};


#[tauri::command]
pub fn get_report_header(mysql_pool: State<mysql::Pool>)-> Result<Vec<ReportHeader>, String>{
    let mut conn = mysql_pool.get_conn().map_err(|err| format!("Failed to get connection: {}", err))?;
    let db_report: Vec<ReportHeader> = conn.exec_map(
        "SELECT DISTINCT * FROM reportheader",
        (),
        |(transactionid, subject_code, subject_name, shift_number, transactiondate, room_number,proctor): (String, String, String, String, String, String, String)| {
            ReportHeader {
                transactionid,
                subject_code,
                subject_name,
                shift_number,
                transactiondate,
                room_number,
                proctor,
            }
        },
    ).map_err(|err| format!("Failed to fetch report: {}", err))?;
    
    Ok(db_report)
}

#[tauri::command]
pub fn get_report_header_by_id(transactionid: &str, mysql_pool: State<mysql::Pool>) -> Result<Vec<ReportHeader>, String> {
    let mut conn = mysql_pool.get_conn().map_err(|err| format!("Failed to get connection: {}", err))?;
    let db_report: Vec<ReportHeader> = conn.exec_map(
        "SELECT DISTINCT * FROM reportheader WHERE transactionid = :transactionid",
        params! {"transactionid" => transactionid},
        |(transactionid, subject_code, subject_name, shift_number, transactiondate, room_number,proctor): (String, String, String, String, String, String, String)| {
            ReportHeader {
                transactionid,
                subject_code,
                subject_name,
                shift_number,
                transactiondate,
                room_number,
                proctor,
            }
        },
    ).map_err(|err| format!("Failed to fetch report: {}", err))?;
    
    Ok(db_report)
}

#[tauri::command]
pub fn get_report_detail_by_id(transactionid: &str, mysql_pool: State<mysql::Pool>) -> Result<Vec<ReportDetail>, String> {
    let mut conn = mysql_pool.get_conn().map_err(|err| format!("Failed to get connection: {}", err))?;
    let db_report: Vec<ReportDetail> = conn.exec_map(
        "SELECT DISTINCT * FROM reportdetail WHERE transactionid = :transactionid",
        params! {"transactionid" => transactionid},
        |(transactionid,nim,name,seat_number,markreason,evidencephoto): (String, String, String, String, String,Vec<u8>)| {
            ReportDetail {
                transactionid,
                nim,
                name,
                seat_number,
                markreason,
                evidencephoto
            }
        },
    ).map_err(|err| format!("Failed to fetch report: {}", err))?;
    
    Ok(db_report)
}