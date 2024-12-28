use bcrypt::hash;
use bcrypt::DEFAULT_COST;
use chrono::NaiveDateTime;
use cynic::GraphQlResponse;
use cynic::QueryBuilder;
use mysql::params;
use mysql::prelude::Queryable;
use mysql::Conn;
use mysql::Pool;
use tauri::State;
use chrono::NaiveDate;
use chrono::Local;
use std::collections::HashSet;
use std::ptr::null;
use rand::seq::SliceRandom;
use crate::model::CurrentUser;
use crate::model::Users;
use crate::schema::GetStudentsByClassAndSubjectCode;
use crate::schema::GetStudentsByClassAndSubjectCodeArg;
use crate::schema::User;
use crate::schema::UserArgumentsByNIM;
use crate::schema::UserQueryByNIM;

#[tauri::command]
pub fn allocatestudent(subjectcode:&str,classcode:Vec<&str>,dateschedule:Option<&str>,timeschedule:&str,rooms:&str,caninsert:&str,mysql_pool: State<Pool>,current_user: State<CurrentUser> )->Vec<String>{
    if(subjectcode=="" || timeschedule=="" || rooms=="" ||classcode.is_empty() || dateschedule.is_none()){
        return vec!["All Field must be Filled !".to_string()];
    }
    let date_str = dateschedule.unwrap();
    let date = match NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
        Ok(date) => date,
        Err(_) => return vec!["Invalid date format!".to_string()],
    };

    if date < Local::now().naive_local().into() {
        return vec!["Date must be in the future!".to_string()];
    }

    let shift_number = match determine_shift_number(timeschedule) {
        Some(shift) if (1..=6).contains(&shift) => shift,
        _ => return vec!["Invalid time format or out of working hours!".to_string()],
    };

    // Mulai algorithm
    let mut conn = mysql_pool.get_conn().expect("Failed to get connection.");
    //ambil room capacity
    let mut db_room_capacity: i32 = match conn.exec_first("SELECT room_capacity FROM rooms WHERE room_number = :num", params! {
        "num" => rooms,
    }) {
        Ok(capacity) => capacity.expect("Room capacity not found"), // Extract the room capacity
        Err(_) => return vec!["Failed to retrieve room capacity".to_string()],
    };

    //ambil student pakek graphql
    let mut nim_list: Vec<String> = Vec::new();
    let mut nim_failed_list: Vec<(String, String)> = Vec::new();

    for code in classcode{

        let operation = GetStudentsByClassAndSubjectCode::build(GetStudentsByClassAndSubjectCodeArg {
            class_code: code.to_string(),
            subject_code: subjectcode.to_string(),
        });
        
        match reqwest::blocking::Client::new()
        .post("https://academic-slc.apps.binus.ac.id/tpa-241/query")
        .json(&operation)
        .send()
        {
            Ok(response) => {
                // Handle the GraphQL response here
                if response.status().is_success() {
                    // Parse and process the response data
                    let graphql_response = response.json::<GraphQlResponse<GetStudentsByClassAndSubjectCode>>().unwrap();
                    println!("GraphQL response: {:?}", graphql_response);
                    if let Some(data) = graphql_response.data {
                        println!("Data: {:?}", data);
                        if let Some(students) = data.get_students_by_class_and_subject_code {
                            println!("Students: {:?}", students);
                            nim_list.extend(students.iter().cloned());
                        }
                    }
                } else {
                    return vec![format!("Failed to fetch students from GraphQL server: {}", response.status())];
                }
            }
            Err(err) => {
                print!("Error nih bang");
                return vec![format!("Failed to send GraphQL request: {}", err)];
            }
        }
    }

    println!("nim: {:?}",nim_list);
    // check student must not have been assigned with the same subject code
    for student in &nim_list {
        let db_check_student: Option<String> = match conn.exec_first("SELECT subject_code FROM transactionheader th JOIN transactiondetail td ON th.transactionid = td.transactionid WHERE subject_code = :subjectcode AND nim = :nim", params! {
            "subjectcode" => subjectcode,
            "nim" => student
        }) {
            Ok(subject_code) => subject_code, // Extract the subject code if found
            Err(_) => return vec!["Failed to retrieve subject code".to_string()],
        };
    
        if let Some(_) = db_check_student {
            // Add the student to the failed list
            nim_failed_list.push((student.clone(), "Duplicate subject code".to_string()));
        }
    }
    // apus yang ada di original failed nya
    nim_list.retain(|student| !nim_failed_list.iter().any(|(nim, _)| nim == student));
    println!("nim: {:?}",nim_list);
    //The exam schedule must not clash with the student’s other schedule.
    for student in &nim_list {
        let db_check_student: Option<String> = match conn.exec_first("SELECT subject_code FROM transactionheader th JOIN transactiondetail td ON th.transactionid = td.transactionid WHERE transactiondate = :transactiondate AND nim = :nim AND shift_number = :shift_number", params! {
            "transactiondate" => date.format("%Y-%m-%d").to_string(),
            "nim" => student,
            "shift_number" => shift_number.to_string()
        }) {
            Ok(subject_code) => subject_code, // Extract the subject code if found
            Err(_) => return vec!["Failed to retrieve subject code".to_string()],
        };
    
        if let Some(_) = db_check_student {
            // Add the student to the failed list
            nim_failed_list.push((student.clone(), "Schedule Clashed".to_string()));
        }
    }
    // apus yang ada di original failed nya
    nim_list.retain(|student| !nim_failed_list.iter().any(|(nim, _)| nim == student));

    println!("nim: {:?}",nim_list);
    // check room capacity muat ga
    for student in &nim_list{
        db_room_capacity -= 1;
        if(db_room_capacity<0){
            nim_failed_list.push((student.clone(), "Room Capacity Full".to_string()));
        }
    }
    nim_list.retain(|student| !nim_failed_list.iter().any(|(nim, _)| nim == student));
    println!("nim: {:?}",nim_list);

    if caninsert == "No" {
        let mut combined_list = nim_list.iter()
            .map(|nim| format!("{} - can be inserted", nim))
            .collect::<Vec<String>>();
        
        combined_list.extend(nim_failed_list.iter()
            .map(|(nim, reason)| format!("{} - {}", nim, reason))
        );
    
        return combined_list;
    }

    // dapetin subject name by subject code
    let db_subject_name: String = conn.exec_first("SELECT subject_name FROM subjects WHERE subject_code = :subject_code", params! {
        "subject_code" => subjectcode.to_string()
    }).unwrap().unwrap_or_else(|| "Failed to retrieve subject name".to_string());

    // Insert transactioin header
    if(nim_list.len()>0 && caninsert == "Yes"){

        let last_transaction_id = match conn.exec_first::<String, _, _>("SELECT transactionId FROM transactionheader ORDER BY transactionId DESC LIMIT 1", ()) {
            Ok(Some(id)) => id,
            Ok(None) => "TR000".to_string(), // If there are no existing transaction IDs, start with TR000
            Err(_) => return vec!["Failed to retrieve last transaction ID".to_string()],
        };
        
        
        // Calculate the new transaction ID
        let new_transaction_id = match last_transaction_id.trim_start_matches("TR").parse::<u32>() {
            Ok(last_number) => format!("TR{:03}", last_number + 1),
            Err(_) => "TR001".to_string(),
        };
                
        let query = "INSERT INTO transactionheader (transactionid, subject_code, shift_number, transactiondate, room_number,proctor,status,subject_name) VALUES (:transactionid, :subject_code, :shift_number, :transactiondate, :room_number, :proctor,:status,:subject_name)";
        match conn.exec_drop(query, params! {
            "transactionid" => &new_transaction_id.to_string(),
            "subject_code" => subjectcode,
            "shift_number" => shift_number.to_string(),
            "transactiondate" => date.format("%Y-%m-%d").to_string(),
            "room_number" => rooms.to_string(),
            "proctor" => None::<String>,
            "status" => "Unfinished".to_string(),
            "subject_name" => db_subject_name.to_string()
        }) {
            Ok(_) => {
                println!("Successfully inserted transaction for student: {:?}", nim_list);
            },
            Err(err) => {
                println!("Error inserting transaction for student {:?}: {}", nim_list, err);
            }
        };
    
        // Insert every student into transaction detail
        let mut rng = rand::thread_rng();
        let mut seat_numbers: Vec<usize> = (1..=nim_list.len()).collect();
        seat_numbers.shuffle(&mut rng);
    
        for (student, &seat_number) in nim_list.iter().zip(seat_numbers.iter()) {
            let query = "SELECT class_code FROM enrollments WHERE nim = :nim";
            match conn.exec_first::<String, _, _>(query, params! {
                "nim" => student,
            }) {
                Ok(Some(class_code)) => {
                    // Insert each student with their corresponding seat number and class code
                    let query = "INSERT INTO transactiondetail (transactionid, seatnumber, nim, class_code,examstatus) VALUES (:transactionid, :seat_number, :nim, :class_code,:examstatus)";
                    match conn.exec_drop(query, params! {
                        "transactionid" => &new_transaction_id.to_string(),
                        "seat_number" => seat_number,
                        "nim" => student,
                        "class_code" => class_code,
                        "examstatus" => "NF"
                    }) {
                        Ok(_) => {
                            println!("Successfully inserted transaction for student: {}", student);
                            let query = "SELECT nim FROM users WHERE nim = ?";
                            match conn.exec_first::<String, _, _>(query, (student,)) {
                                Ok(Some(_)) => {
                                    println!("Student with NIM {} exists in the database.", student);
                                }
                                Ok(None) => {
                                    println!("Student with NIM {} does not exist in the database.", student);
                                    match send_request(student) {
                                        Ok(user_data) => {
                                            println!("User data: {:?}", user_data);
                                            let hashed_password = hash(student, DEFAULT_COST).expect("Failed to hash password");
                                            let hashed_pass_string:String = hashed_password;
                                            let query = "INSERT INTO users (bn_number, username, nim, password, role, major, initial) VALUES (:bn_number, :username, :nim, :password, :role, :major, :initial)";
                                            let params = params! {
                                                "bn_number" => &user_data.bn_number.inner(),
                                                "username" => &user_data.name,
                                                "nim" => &user_data.nim,
                                                "password" => hashed_pass_string,
                                                "role" => &user_data.role,
                                                "major" => &user_data.major,
                                                "initial" => &user_data.initial
                                            };
                                            match conn.exec_drop(query, params) {
                                                Ok(_) => {
                                                    println!("User inserted into database: {:?}", user_data.bn_number);
                                                    
                                                },
                                                Err(err) => {
                                                    println!("Failed to insert user into database: {}", err);
                                                    
                                                },
                                            }
                                        },
                                        Err(err) => {
                                            println!("Error: {}", err);
                                        }
                                    }
                                }
                                Err(err) => {
                                    eprintln!("Error while checking for student existence: {}", err);
                                }
                            }
                            
                        },
                        Err(err) => {
                            println!("Error inserting transaction for student {}: {}", student, err);
                        }
                    };
                },
                Ok(None) => {
                    println!("Class code not found for student: {}", student);
                },
                Err(err) => {
                    println!("Error retrieving class code for student {}: {}", student, err);
                }
            };
        }
        println!("{:?}",nim_failed_list);
        let mut result: Vec<String> = Vec::new();
        result.insert(0, format!("{} Successfully Inserted", nim_list.len()));
        result.extend(nim_failed_list.iter().map(|(nim, reason)| format!("{} - {}", nim, reason)));
        result
    }else{
        vec!["All student Failed to be inserted!".to_string()]
    }
}

fn send_request(nim:&str) -> Result<User, Box<dyn std::error::Error>> {

    let operation = UserQueryByNIM::build(UserArgumentsByNIM{
        nim:nim.into(),
    }); 
    let response = reqwest::blocking::Client::new()
    .post("https://academic-slc.apps.binus.ac.id/tpa-241/query")
    .json(&operation)
    .send()?;

    let graphql_response = response.json::<GraphQlResponse<UserQueryByNIM>>()?;
    if let Some(user_query) = graphql_response.data {
        let user_struct = User{
            bn_number: user_query.get_user_by_nim.bn_number,
            name: user_query.get_user_by_nim.name,
            nim: user_query.get_user_by_nim.nim,
            role: user_query.get_user_by_nim.role,
            major: user_query.get_user_by_nim.major,
            initial: user_query.get_user_by_nim.initial,  
        };
        if user_struct.initial.is_none() {
            Ok(user_struct)
            
        }else{
            Err("Not a student".into())
        }
    }else {
        Err("No data returned from the GraphQL response".into())
    }
    
}

fn determine_shift_number(time: &str) -> Option<u8> {
    let start_end_times: Vec<(&str, &str, u8)> = vec![
        ("07:00", "09:20", 1),
        ("09:20", "11:00", 2),
        ("11:00", "13:20", 3),
        ("13:20", "15:00", 4),
        ("15:00", "17:20", 5),
        ("17:20", "19:00", 6),
    ];

    for (start, end, shift) in start_end_times {
        let (start_hour, start_minute) = parse_time(start);
        let (end_hour, end_minute) = parse_time(end);
        let (time_hour, time_minute) = parse_time(time);

        if time_hour == start_hour && time_minute >= start_minute && (time_hour < end_hour || (time_hour == end_hour && time_minute < end_minute)) {
            return Some(shift);
        }
    }

    None
}

fn parse_time(time: &str) -> (u32, u32) {
    let parts: Vec<&str> = time.split(':').collect();
    if let [hour, minute] = parts.as_slice() {
        if let (Ok(hour), Ok(minute)) = (hour.parse(), minute.parse()) {
            return (hour, minute);
        }
    }
    (0, 0) // Default value if parsing fails
}

#[tauri::command]
pub fn get_all_assistant(mysql_pool: State<mysql::Pool>) -> Result<Vec<Users>, String> {
    let mut conn = mysql_pool.get_conn().map_err(|err| format!("Failed to get connection: {}", err))?;

    let db_assistant = conn.query_map(
        "SELECT bn_number, username, nim, password, role, major, initial FROM users WHERE role = 'assistant' OR role = 'Subject Development' OR role = 'Exam Coordinator'",
        |(bn_number, username, nim, password, role, major, initial)| {
            Users {
                bn_number,
                username,
                nim,
                password,
                role,
                major,
                initial,
            }
        },
    ).map_err(|err| format!("Failed to fetch assistants: {}", err))?;

    Ok(db_assistant)
}

#[tauri::command]
pub fn allocateassistant(transactionid:Vec<&str>,assistant:Vec<Users>,selectedassistant:Vec<&str>,selectedgeneration:Vec<&str>,caninsert:&str,mysql_pool: State<Pool>)->Vec<String>{
    println!("{:?}",transactionid);
    println!("{:?}",assistant);
    println!("{:?}",selectedassistant);
    println!("{:?}",selectedgeneration);
    if(transactionid.is_empty()){
        return vec!["Please Choose at least 1 transaction !".to_string()];
    }
    else if(selectedassistant.is_empty() && selectedgeneration.is_empty()){
        return vec!["Please Choose either by selecting assistant or generation !".to_string()];
    }
    else{
        let mut initial_list: Vec<String> = Vec::new();
        let mut assistant_nim_list: Vec<String> = Vec::new();
        let mut initial_failed_list: Vec<(String, String)> = Vec::new();

        // ambil semua assistant yang ada
        if !selectedassistant.is_empty() {
            for user in &assistant {
                if let Some(initial) = &user.initial {
                    for assistant in &selectedassistant {
                        if initial == assistant {
                            if !assistant_nim_list.contains(&user.nim) {
                                assistant_nim_list.push(user.nim.clone());
                            }
                        }
                    }
                }
            }
            initial_list.extend(selectedassistant.iter().map(|&s| s.to_string()));
        }
        
        

        if !selectedgeneration.is_empty() {
            for generation in &selectedgeneration {
                for user in &assistant {
                    if let Some(initial) = &user.initial {
                        if initial.ends_with(generation) {
                            initial_list.push(initial.clone());
                            if !assistant_nim_list.contains(&user.nim) {
                                assistant_nim_list.push(user.nim.clone());
                            }
                        }
                        
                    }    
                }
            }
        }
        initial_list.sort();
        initial_list.dedup();
        println!("{:?}",assistant_nim_list);
        // check apakah assistant di allocate exam di transaction detail
        let mut conn = mysql_pool.get_conn().expect("Failed to get connection.");
        for nim in &assistant_nim_list {
            println!("Attempting to retrieve seatnumber for nim: {}", nim);
            match conn.exec_first::<String, _, _>("SELECT class_code FROM transactiondetail WHERE nim = :nims", params! {
                "nims" => nim.to_string(),
            }) {
                Ok(Some(_)) => {
                    // If the result is Some, it means the assistant is allocated in the transaction detail
                    initial_failed_list.push((nim.clone(), "Assistant as a Student have been allocated to an exam !".to_string()));
                }
                Ok(None) => {
                    // If the result is None, the assistant is not allocated in the transaction detail
                    // No action needed
                    println!("No seat number found for nim: {}", nim);
                    
                }
                _ => {}
            }
        }
        initial_list.retain(|nim| !initial_failed_list.iter().any(|(failed_nim, _)| failed_nim == nim));

        //The proctor has not been allocated for an exam with the same subject code
        for transaction in &transactionid{
            let query = "SELECT subject_code FROM transactionheader WHERE transactionid = :transactionid";
            match conn.exec_first::<String, _, _>(query, params! {
                "transactionid" => transaction,
            }){
                Ok(Some(subject_code)) => {
                    // If the result is Some, it means the subject code is found
                    println!("Subject code found: {}", subject_code);
                    for initial in &initial_list {
                        match conn.exec_first::<String, _, _>("SELECT subject_code FROM transactionheader WHERE proctor = :initial AND subject_code = :subject_code", params! {
                            "nim" => initial.to_string(),
                            "subject_code" => subject_code.to_string()
                        }) {
                            Ok(Some(_)) => {
                                // If the result is Some, it means the assistant is allocated in the transaction detail
                                initial_failed_list.push((initial.clone(), "Assistant already been assigned to the same subject code !".to_string()));
                            }
                            Ok(None) => {
                                // If the result is None, the assistant is not allocated in the transaction detail
                                // No action needed
                            }
                            _ => {}
                        }
                    }
                }
                Ok(None) => {
                    // If the result is None, the subject code is not found
                    println!("Subject code not found for transaction ");
                }
                Err(_) => {
                    // If an error occurs during the database query
                    println!("Failed to retrieve subject code from the database");
                    return vec!["Failed to retrieve subject code from the database".to_string()];
                }
            }
        }
        initial_list.retain(|nim| !initial_failed_list.iter().any(|(failed_nim, _)| failed_nim == nim));
        
        if caninsert == "No" {
            let mut combined_list = initial_list.iter()
                .map(|initial| format!("{} - can be inserted", initial))
                .collect::<Vec<String>>();
            
            combined_list.extend(initial_failed_list.iter()
                .map(|(initial, reason)| format!("{} - {}", initial, reason))
            );
        
            return combined_list;
        }
        if caninsert == "Yes" {
            let mut success_insert = 0;
            for transaction in &transactionid {
                let mut updated = false;
                for (initial_index, initial) in initial_list.iter().enumerate() {
                    let query = "UPDATE transactionheader SET proctor = :initial WHERE transactionid = :transactionid";
                    match conn.exec_drop(query, params! {
                        "initial" => initial,
                        "transactionid" => transaction,
                    }) {
                        Ok(_) => {
                            println!("Proctor {} assigned to transaction {}", initial, transaction);
                            success_insert+=1;
                            updated = true;
                            initial_list.remove(initial_index); // Remove the initial from initial_list
                            break;
                        }
                        Err(err) => {
                            println!("Failed to assign proctor {} to transaction {}: {}", initial, transaction, err);
                        }
                    }
                }
            }
            for initial in &initial_list {
                // Insert the remaining initials into the failed list
                initial_failed_list.push((initial.clone(), "Transaction already fulfilled".to_string()));
            }
            let mut result: Vec<String> = Vec::new();
            result.push(format!("{} successfully inserted", success_insert));
            result.extend(initial_failed_list.iter().map(|(initial, reason)| format!("{} - {}", initial, reason)));
            return result;

        }
        
        
        
        
        
        
        
        
        return vec!["ok !".to_string()];
    }

}
