use std::ptr::null;
use chrono::{DateTime, Datelike, Local, NaiveTime, Timelike};
use multipart::server::Multipart;
use mysql::{params, prelude::*};
use serde::{de, Deserialize};
use tauri::State;
use crate::model::{CurrentUser, TransactionHeader};
use base64;


#[tauri::command]
pub fn get_all_transaction(mysql_pool: State<mysql::Pool>) -> Result<Vec<TransactionHeader>, String> {
    let mut conn = mysql_pool.get_conn().map_err(|err| format!("Failed to get connection: {}", err))?;
    
    let db_transaction = conn.query_map(
        "SELECT transactionid, subject_code, shift_number, transactiondate, room_number, proctor, status,subject_name FROM transactionheader",
        |(transactionid, subject_code, shift_number, transactiondate, room_number, proctor,status,subject_name): (String, String, String, String, String, Option<String>,String,String)| {
            TransactionHeader {
                transactionid,
                subject_code,
                shift_number,
                transactiondate,
                room_number,
                proctor,
                status,
                subject_name
            }
        },
    ).map_err(|err| format!("Failed to fetch transactions: {}", err))?;
    let now = Local::now();
    let today_date = now.naive_local().date();
    let current_time = now.time();
    let shift_times = [
        ("1", NaiveTime::from_hms_opt(7, 0, 0).unwrap(), NaiveTime::from_hms_opt(9, 20, 0).unwrap()),
        ("2", NaiveTime::from_hms_opt(9, 20, 0).unwrap(), NaiveTime::from_hms_opt(11, 0, 0).unwrap()),
        ("3", NaiveTime::from_hms_opt(11, 0, 0).unwrap(), NaiveTime::from_hms_opt(13, 20, 0).unwrap()),
        ("4", NaiveTime::from_hms_opt(13, 20, 0).unwrap(), NaiveTime::from_hms_opt(15, 0, 0).unwrap()),
        ("5", NaiveTime::from_hms_opt(15, 0, 0).unwrap(), NaiveTime::from_hms_opt(17, 20, 0).unwrap()),
        ("6", NaiveTime::from_hms_opt(17, 20, 0).unwrap(), NaiveTime::from_hms_opt(23, 0, 0).unwrap()),
    ];

    for transaction in &db_transaction {
        // Check if today's date matches the date in the database
        if transaction.transactiondate == today_date.to_string() {
            // Find the shift time range for the transaction's shift number
            if let Some((shift_number, start_time, end_time)) = shift_times.iter().find(|(num, _, _)| *num == &transaction.shift_number) {
                // Check if the current time is within the shift time range
                if current_time >= *start_time && current_time <= *end_time {
                    let transaction_id = transaction.transactionid.clone();
                    let update_result = conn.exec_drop(
                        "UPDATE transactionheader SET status = 'Ongoing' WHERE transactionid = :transactionid",
                        params! {
                            "transactionid" => transaction_id,
                        }
                    );
                    
                    // Check if the update was successful
                    if let Err(err) = update_result {
                        return Err(format!("Failed to update status for transaction {}: {}", transaction.transactionid, err));
                    }
                }
            }
        }
    }
    Ok(db_transaction)
}

#[tauri::command]
pub fn get_all_transaction_by_initial(
    initial: &str,
    mysql_pool: State<mysql::Pool>
) -> Result<Vec<TransactionHeader>, String> {
    let mut conn = mysql_pool.get_conn().map_err(|err| format!("Failed to get connection: {}", err))?;
    
    let db_transaction: Vec<TransactionHeader> = conn.exec_map(
        "SELECT transactionid, subject_code, subject_name, room_number, transactiondate, shift_number, proctor, status FROM transactionheader WHERE proctor = :initial",
        params!{"initial" => initial},
        |(transactionid, subject_code, subject_name, room_number, transactiondate, shift_number,proctor, status): (String, String, String, String, String, String, Option<String>, String)| {
            TransactionHeader {
                transactionid,
                subject_code,
                subject_name,
                room_number,
                transactiondate,
                shift_number,
                proctor,
                status,
            }
        },
    ).map_err(|err| format!("Failed to fetch transactions: {}", err))?;
    
    Ok(db_transaction)
}

#[tauri::command]
pub fn get_student_exam(nim: &str, mysql_pool: State<mysql::Pool>) -> Result<Vec<Vec<String>>, String> {
    let mut conn = mysql_pool.get_conn().map_err(|err| format!("Failed to get connection: {}", err))?;
    let db_transaction: Result<Vec<Vec<String>>, mysql::Error> = conn.exec_map(
        "SELECT subject_code, subject_name, room_number, transactiondate, shift_number, seatnumber,status,th.transactionid,examstatus FROM transactionheader th JOIN transactiondetail td ON th.transactionid = td.transactionid WHERE nim = :nim",
        params!{"nim" => nim},
        |(subject_code, subject_name, room_number, transactiondate, shift_number, seatnumber,status,transactionid,examstatus): (String, String, String, String, String, i32,String,String,String)| { 
            let seatnumber_str = seatnumber.to_string();
            vec![subject_code, subject_name, room_number, transactiondate, shift_number, seatnumber_str,status,transactionid,examstatus]
        },
    );
    

    match &db_transaction {
        Ok(data) => {
            println!("Data retrieved from the database: {:?}", data);
        
        }
        Err(err) => {
            println!("Error retrieving data from the database: {}", err);
        }
    }
    
    db_transaction.map_err(|err| err.to_string())
}

#[tauri::command]
pub fn upload_file(form: Vec<u8>,nim:&str,transactionid:&str,mysql_pool: State<mysql::Pool>){
    println!("{:?}",form);
    println!("{:?}",transactionid);
    println!("{:?}",nim);
    let mut conn = mysql_pool.get_conn().expect("Failed to get MySQL connection");
    let query = "UPDATE transactiondetail SET file = :file, examstatus = :status WHERE nim = :nim AND transactionid = :transactionid";
    conn.exec_drop(query, params! {
        "file" => form,
        "nim" => nim,
        "status" => "Uploaded",
        "transactionid" => transactionid,
    }).expect("Failed to execute SQL query");

}

#[tauri::command]
pub fn download_file(nim: &str, transactionid: &str, mysql_pool: State<mysql::Pool>) -> Option<Vec<u8>> {
    let mut conn = mysql_pool.get_conn().expect("Failed to get MySQL connection");
    let query = "SELECT file FROM transactiondetail WHERE nim = :nim AND transactionid = :transactionid";
    if let Ok(db_answer) = conn.exec_map(query, params! {
        "nim" => nim,
        "transactionid" => transactionid,
    }, |(file,): (Vec<u8>,)| file) {
        if let Some(file) = db_answer.into_iter().next() {
            println!("Download: {:?}",file);
            return Some(file);
        }
    }
    None
}

#[tauri::command]
pub fn finalize_exam(nim: &str, transactionid: &str, mysql_pool: State<mysql::Pool>) -> bool{
    let mut conn = mysql_pool.get_conn().expect("Failed to get MySQL connection");
    let query = "UPDATE transactiondetail SET examstatus = :finalized WHERE nim = :nim AND transactionid = :transactionid";
    conn.exec_drop(query, params! {
        "finalized" => "Finalized",
        "nim" => nim,
        "transactionid" => transactionid,
    }).expect("Failed to execute SQL query");
    return true
}


#[tauri::command]
pub fn upload_exam_case(form: Vec<u8>,transactionid:&str,mysql_pool: State<mysql::Pool>){
    println!("{:?}",form);
    println!("{:?}",transactionid);
    let mut conn = mysql_pool.get_conn().expect("Failed to get MySQL connection");
    let query = "UPDATE transactionheader SET examcase = :file WHERE transactionid = :transactionid";
    conn.exec_drop(query, params! {
        "file" => form,
        "transactionid" => transactionid,
    }).expect("Failed to execute SQL query");

}

#[tauri::command]
pub fn download_exam_case(transactionid: &str, mysql_pool: State<mysql::Pool>) -> Option<Vec<u8>> {
    let mut conn = mysql_pool.get_conn().expect("Failed to get MySQL connection");
    let query = "SELECT examcase FROM transactionheader WHERE transactionid = :transactionid";
    if let Ok(db_answer) = conn.exec_map(query, params! {
        "transactionid" => transactionid,
    }, |(file,): (Vec<u8>,)| file) {
        if let Some(file) = db_answer.into_iter().next() {
            println!("Download: {:?}",file);
            return Some(file);
        }
    }
    None
}



#[tauri::command]
pub fn get_transaction_by_id(transactionid: &str, mysql_pool: State<mysql::Pool>)->Result<Vec<TransactionHeader>, String>{
    let mut conn = mysql_pool.get_conn().map_err(|err| format!("Failed to get connection: {}", err))?;
    
    let db_transaction: Vec<TransactionHeader> = conn.exec_map(
        "SELECT transactionid, subject_code, subject_name, room_number, transactiondate, shift_number, proctor, status FROM transactionheader WHERE transactionid = :id",
        params!{"id" => transactionid},
        |(transactionid, subject_code, subject_name, room_number, transactiondate, shift_number,proctor, status): (String, String, String, String, String, String, Option<String>, String)| {
            TransactionHeader {
                transactionid,
                subject_code,
                subject_name,
                room_number,
                transactiondate,
                shift_number,
                proctor,
                status,
            }
        },
    ).map_err(|err| format!("Failed to fetch transactions: {}", err))?;
    
    Ok(db_transaction)
}

#[tauri::command]
pub fn get_transaction_detail_by_id(transactionid: &str, mysql_pool: State<mysql::Pool>) -> Result<Vec<(i32, String, String, String, String)>, String> {
    let mut conn = mysql_pool.get_conn().map_err(|err| format!("Failed to get connection: {}", err))?;
    
    let db_schedule: Result<Vec<(i32, String, String, String, String)>, mysql::Error> = conn.exec_map(
        "SELECT DISTINCT seatnumber, td.nim, username, examstatus, 
        CASE WHEN file IS NOT NULL THEN 'YES' ELSE 'NO' END AS file_exists 
        FROM transactiondetail td 
        JOIN users u ON td.nim = u.nim 
        WHERE transactionid = :transactionid 
        ORDER BY seatnumber ASC",
        params! {"transactionid" => transactionid},
        |(seatnumber, nim, username, status, file_exists): (i32, String, String, String, String)| {
            (seatnumber, nim, username, status, file_exists)
        },
    );

    match db_schedule {
        Ok(data) => {
            println!("Transaction detail fetched successfully: {:?}", data);
            Ok(data)
        },
        Err(err) => {
            eprintln!("Failed to fetch transaction detail: {}", err);
            Err(format!("Failed to fetch transaction detail: {}", err))
        }
    }
}



#[tauri::command]
pub fn change_seat(transactionid:&str,nim:&str,name:&str,oldseat:&str,newseat:&str,reason:&str,mysql_pool: State<mysql::Pool>)->String{
    println!("nyampe");
    if newseat=="" || reason=="" {
        return "All Field Must be Filled !".to_string()
    }
    else if(newseat == oldseat){
        return "Cannot change to the same seat !".to_string()
    }
    else {
        let new_seat_number = match newseat.parse::<i32>() {
            Ok(num) => num,
            Err(_) => {
                return "Invalid seat number".to_string();
            }
        };
        if(new_seat_number<=0){
            return "Seat must be more than 0!".to_string()
        }
        let mut conn = mysql_pool.get_conn().expect("Failed to connect");
        // validate seat must be empty 
        let query = "SELECT seatnumber FROM transactiondetail WHERE transactionid = :transactionid";
        let db_seat: Vec<i32> = conn.exec_map(
            query,
            params! {"transactionid" => transactionid},
            |(seatnumber,)| seatnumber
        ).unwrap_or_else(|err| {
            eprintln!("Error fetching seat numbers: {}", err);
            Vec::new() // Return an empty vector if there's an error
        });

        if db_seat.contains(&newseat.parse::<i32>().unwrap_or_default()) {
            return format!("Seat is already taken!");
        }

        // AMBIL ROOM NUMBER BY TRANSACTION ID
        let room_number_query = "SELECT room_number FROM transactionheader WHERE transactionid = :transactionid";

        // Fetch the room number from the database
        let room_number: String = match conn.exec_first(room_number_query, params! {"transactionid" => transactionid}) {
            Ok(Some(room)) => room,
            Ok(None) => {
                return "Room number not found for the provided transaction ID".to_string();
            }
            Err(err) => {
                eprintln!("Error fetching room number: {}", err);
                return format!("Error fetching room number: {}", err);
            }
        };

        // cannot exceed room capacity
        let mut db_room_capacity: i32 = match conn.exec_first("SELECT room_capacity FROM rooms WHERE room_number = :num", params! {
            "num" => room_number,
        }) {
            Ok(Some(capacity)) => capacity, // Extract the room capacity
            Ok(None) => {
                eprintln!("Room capacity not found");
                return "Room capacity not found".to_string();
            },
            Err(err) => {
                eprintln!("Error fetching room capacity: {}", err);
                return format!("Error fetching room capacity: {}", err);
            }
        };

        if new_seat_number > db_room_capacity {
            return format!("New seat exceeds room capacity!");
        }

        let update_query = "UPDATE transactiondetail SET seatnumber = :newseat WHERE transactionid = :transactionid AND nim = :nim";
        conn.exec_drop(update_query, params! {
            "newseat" => new_seat_number,
            "transactionid" => transactionid,
            "nim" => nim,
        }).map_err(|err| format!("Failed to update seat number: {}", err)).expect("Failed to execute SQL query");

        let reasons = format!("Previous Seat: {} to New Seat: {}. Reason: {}", oldseat, newseat, reason);


        let insert_query = "INSERT INTO notes (transactionid, nim,name,seatnumber,causes,reason) VALUES (:transactionid, :nim,:name,:seatnumber,:causes,:reason)";
        conn.exec_drop(insert_query, params! {
            "transactionid" => transactionid,
            "nim" => nim,
            "name" => name,
            "seatnumber" => new_seat_number,
            "causes" => "Change Seat",
            "reason" => reasons,
        }).map_err(|err| format!("Failed to insert note: {}", err)).expect("Failed to execute SQL query");
        

        return "ok".to_string();
    }
}

#[tauri::command]
pub fn mark_cheat(detail:Vec<&str>, markreason:&str, photos:Vec<Vec<u8>>,transactions:Vec<TransactionHeader>,mysql_pool: State<mysql::Pool>)->String{
    println!("{:?}",detail);
    println!("{:?}",markreason);
    println!("{:?}",photos);
    println!("{:?}",transactions);
    if(markreason=="" || photos.is_empty()){
        return "All Field Must be Filled !".to_string()
    }
    else{
        let mut conn = mysql_pool.get_conn().expect("Failed to connect");

        for transaction in transactions {

            let insert_query = "INSERT INTO reportheader (transactionid, subject_code, subject_name, shift_number, transactiondate, room_number, proctor) VALUES (:transactionid, :subject_code, :subject_name, :shift_number, :transactiondate, :room_number, :proctor)";
            
            conn.exec_drop(insert_query, params! {
                "transactionid" => &transaction.transactionid,
                "subject_code" => &transaction.subject_code,
                "subject_name" => &transaction.subject_name,
                "shift_number" => &transaction.shift_number,
                "transactiondate" => &transaction.transactiondate,
                "room_number" => &transaction.room_number,
                "proctor" => transaction.proctor.as_deref(),
            }).map_err(|err| format!("Failed to insert report header: {}", err)).expect("Failed to execute SQL query");

            for evidence in &photos{
                let insert_detail = "INSERT INTO reportdetail (transactionid, nim, name, seat_number, markreason, evidencephoto) VALUES (:transactionid, :nim, :name, :seat_number, :markreason, :evidencephoto)";
            
                conn.exec_drop(insert_detail, params! {
                    "transactionid" => &transaction.transactionid,
                    "nim" => &detail[1],
                    "name" => &detail[2],
                    "seat_number" => &detail[0],
                    "markreason" => markreason,
                    "evidencephoto" => evidence,
                }).map_err(|err| format!("Failed to insert report detail: {}", err)).expect("Failed to execute SQL query");
            }

        }


        return "ok".to_string()
    }

}

#[tauri::command]
pub fn extend_time_class(transactionid:&str,minutes:&str,reason:&str,mysql_pool: State<mysql::Pool>)->String{
    if(reason=="" || minutes==""){
        return "All field must be filled !".to_string()
    }
    let minutes = match minutes.parse::<i32>() {
        Ok(parsed_minutes) => parsed_minutes,
        Err(_) => return "Invalid minutes value! Please provide a valid integer value for minutes.".to_string(),
    };

    if minutes <= 0 {
        return "Minutes must be greater than 0!".to_string();
    }
    
    let mut conn = mysql_pool.get_conn().expect("Failed to connect");
    let insert_detail = "UPDATE transactionheader SET extendedTime = :time, extendTimeReason = :reason WHERE transactionid = :transactionid";
        
    conn.exec_drop(insert_detail, params! {
        "transactionid" => transactionid,
        "time" =>minutes,
        "reason" =>reason
    }).map_err(|err| format!("Failed to insert report detail: {}", err)).expect("Failed to execute SQL query");


    return "ok".to_string()
    
}

#[tauri::command]
pub fn extend_time_student(transactionid:&str,minutes:&str,reason:&str,nim:&str,name:&str,oldseat:&str,mysql_pool: State<mysql::Pool>)->String{
    println!("nyampoe ectedn stu");
    if(reason=="" || minutes==""){
        return "All field must be filled !".to_string()
    }
    let minutes = match minutes.parse::<i32>() {
        Ok(parsed_minutes) => parsed_minutes,
        Err(_) => return "Invalid minutes value! Please provide a valid integer value for minutes.".to_string(),
    };
    if minutes <= 0 {
        return "Minutes must be greater than 0!".to_string();
    }
    let mut conn = mysql_pool.get_conn().expect("Failed to connect");
    let reasons = format!("Extend Time: {} Minutes. Reason: {}", minutes, reason);


    let insert_query = "INSERT INTO notes (transactionid, nim,name,seatnumber,causes,reason) VALUES (:transactionid, :nim,:name,:seatnumber,:causes,:reason)";
    conn.exec_drop(insert_query, params! {
        "transactionid" => transactionid,
        "nim" => nim.to_string(),
        "name" => name.to_string(),
        "seatnumber" => oldseat.to_string(),
        "causes" => "Time Extension",
        "reason" => reasons,
    }).map_err(|err| format!("Failed to insert note: {}", err)).expect("Failed to execute SQL query");

    return "ok".to_string()
}

#[tauri::command]
pub fn verify_transaction(transactionid:&str,transactionnote:&str,mysql_pool: State<mysql::Pool>,current_user: State<CurrentUser>)->String{
    if(transactionnote==""){
        return "Must Fill transaction note to Verify!".to_string()
    }
    let mut conn = mysql_pool.get_conn().expect("Failed to connect");
    let insert_verify = "UPDATE transactionheader SET verifiedBy = :initial, status = :status WHERE transactionid = :transactionid";
    let current_user_nim = {
        let user = current_user.user.lock().unwrap();
        if let Some(user) = &*user {
            user.initial.clone()
        } else {
            return "No user logged in".to_string();
        }
    };
    conn.exec_drop(insert_verify, params! {
        "transactionid" => transactionid,
        "initial" => current_user_nim,
        "status" => "Finished".to_string()
    }).map_err(|err| format!("Failed to insert report detail: {}", err)).expect("Failed to execute SQL query");


    let insert_query = "INSERT INTO transactionnotes (transactionid, transactionnote) VALUES (:transactionid, :transactionnote)";
    conn.exec_drop(insert_query, params! {
        "transactionid" => transactionid,
        "transactionnote" => transactionnote
    }).map_err(|err| format!("Failed to insert note: {}", err)).expect("Failed to execute SQL query");

    return "ok".to_string()
}

#[tauri::command]
pub fn get_transaction_notes(transactionid:&str,mysql_pool: State<mysql::Pool>)->String{
    let mut conn = mysql_pool.get_conn().expect("Failed to connect");
    let query = "SELECT reason FROM notes WHERE transactionid = :transactionid";
        let db_reason: Vec<String> = conn.exec_map(
            query,
            params! {"transactionid" => transactionid},
            |(reason,)| reason
        ).unwrap_or_else(|err| {
            eprintln!("Error fetching seat numbers: {}", err);
            Vec::new()
        });
    let concatenated_reasons = db_reason.join(", ");
    println!("{:?}",concatenated_reasons);
    if concatenated_reasons.is_empty() {
        String::new()
    } else {
        concatenated_reasons
    }
}
