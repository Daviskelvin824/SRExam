#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::sync::Mutex;
mod schema;
use mysql::Pool;
mod model;
use model::{CurrentUser, MySQLConfig};
mod auth;
use auth::{login,get_current_user,logout,changepassword,get_all_registered_user,change_role};
mod subject;
use subject::getallsubject;
mod enrollment;
use enrollment::{get_class_by_subject_name,get_all_enrollments_from_graphql};
mod room;
use room::{get_all_rooms,get_room_by_date};
mod scheduler;
use scheduler::{allocatestudent,get_all_assistant,allocateassistant};
mod transaction;
use transaction::{get_all_transaction,get_student_exam,upload_file,get_all_transaction_by_initial,download_file,finalize_exam,upload_exam_case,download_exam_case,get_transaction_by_id,get_transaction_detail_by_id,change_seat,mark_cheat,extend_time_class,extend_time_student,verify_transaction,get_transaction_notes};
mod schedule;
use schedule::{get_student_schedule,get_assistant_schedule};
mod report;
use report::{get_report_header,get_report_header_by_id,get_report_detail_by_id};

fn main() {
    let mysql_config = MySQLConfig {
        user: "root".to_string(),
        password: "".to_string(),
        host: "localhost".to_string(),
        database: "desktoptpa".to_string(),
    };

    let mysql_url = mysql_config.format_url();
    let pool = Pool::new(&*mysql_url).expect("Failed getting pool");
    let current_user:CurrentUser = CurrentUser{
        user:Mutex::new(None)
    };

    tauri::Builder::default().manage(pool).manage(current_user)
        .invoke_handler(tauri::generate_handler![login,get_current_user,logout, changepassword,getallsubject,get_all_registered_user,change_role,get_class_by_subject_name,get_all_enrollments_from_graphql,get_all_rooms,allocatestudent,get_all_transaction,get_all_assistant,allocateassistant,get_student_exam,upload_file,get_all_transaction_by_initial,download_file,finalize_exam,upload_exam_case,download_exam_case,get_student_schedule,get_assistant_schedule,get_room_by_date,get_transaction_by_id,get_transaction_detail_by_id,change_seat,mark_cheat,get_report_header,get_report_header_by_id,get_report_detail_by_id,extend_time_class,extend_time_student,verify_transaction,get_transaction_notes])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
