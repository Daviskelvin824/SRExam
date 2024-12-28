use mysql::{prelude::Queryable, params};
use tauri::State;

#[tauri::command]
pub fn get_student_schedule(mysql_pool: State<mysql::Pool>) -> Result<Vec<Vec<String>>, String> {
    // Get a connection from the pool
    let mut conn = mysql_pool.get_conn().map_err(|err| format!("Failed to get connection: {}", err))?;
    
    // Execute the query
    let db_schedule: Result<Vec<Vec<String>>, mysql::Error> = conn.exec_map(
        "SELECT nim, class_code, transactiondate, shift_number, room_number FROM transactionheader th JOIN transactiondetail td ON th.transactionid = td.transactionid",
        (),
        |(nim, class_code, transactiondate, shift_number, room_number): (String, String, String, String, String)| {
            vec![nim, class_code, transactiondate, shift_number, room_number]
        },
    );
    
    // Return the result
    db_schedule.map_err(|err| format!("Failed to fetch schedule: {}", err))
}

#[tauri::command]
pub fn get_assistant_schedule(mysql_pool: State<mysql::Pool>) -> Result<Vec<Vec<String>>, String> {
    // Get a connection from the pool
    let mut conn = mysql_pool.get_conn().map_err(|err| format!("Failed to get connection: {}", err))?;
    
    // Execute the query
    let db_schedule: Result<Vec<Vec<String>>, mysql::Error> = conn.exec_map(
        "SELECT DISTINCT proctor, subject_code, transactiondate, shift_number, room_number FROM transactionheader th JOIN transactiondetail td ON th.transactionid = td.transactionid WHERE proctor IS NOT NULL",
        (),
        |(initial, subject_code, transactiondate, shift_number, room_number): (String, String, String, String, String)| {
            vec![initial, subject_code, transactiondate, shift_number, room_number]
        },
    );
    
    // Return the result
    db_schedule.map_err(|err| format!("Failed to fetch schedule: {}", err))
}