use cynic::{GraphQlResponse, QueryBuilder};
use mysql::{params, prelude::Queryable, Pool};
use tauri::State;

use crate::{model::{Enrollments, Subjects}, schema::GetAllEnrollment};

#[tauri::command]
pub fn get_class_by_subject_name(subjectcode: &str, mysql_pool: State<Pool>) -> Result<Vec<String>, String> {
    println!("{}",subjectcode);
    let mut conn = mysql_pool.get_conn().expect("Failed to get connection.");
    let mut class_codes = Vec::new();
           
    let db_classcodes: Result<Vec<String>, mysql::Error> = conn.exec_map(
        "SELECT class_code FROM enrollments WHERE subject_code = :subject_code",
        params!{"subject_code" => subjectcode},
        |(class_code,): (String,)| class_code,
    );
    
    match db_classcodes {
        Ok(mut codes) => class_codes.append(&mut codes),
        Err(err) => return Err(format!("Failed to fetch class codes: {}", err)),
    }
    
    println!("Class codes: {:?}", class_codes); // Print the vector
    Ok(class_codes)
}


#[tauri::command]
pub fn get_all_enrollments_from_graphql(mysql_pool: State<Pool>) {
    let operation = GetAllEnrollment::build({});
    let response = reqwest::blocking::Client::new()
        .post("https://academic-slc.apps.binus.ac.id/tpa-241/query")
        .json(&operation)
        .send();

    if let Err(err) = response {
        eprintln!("Failed to send GraphQL request: {}", err);
        return;
    }

    let response = response.unwrap();
    let graphql_response = response.json::<GraphQlResponse<GetAllEnrollment>>();

    if let Err(err) = graphql_response {
        eprintln!("Failed to parse GraphQL response: {}", err);
        return;
    }

    let graphql_response = graphql_response.unwrap();

    if let Some(query_result) = graphql_response.data {
        if let Some(enrollment_list) = query_result.get_all_enrollment {
            let mut conn = mysql_pool.get_conn().expect("Failed to get MySQL connection from pool");
            for enrollment in enrollment_list.into_iter().flatten() {
                if let Err(err) = conn.exec_drop(
                    "INSERT INTO enrollments (class_code, nim, subject_code) VALUES (:class_code, :nim, :subject_code)",
                    params!{
                        "class_code" => &enrollment.class_code,
                        "nim" => &enrollment.nim,
                        "subject_code" => &enrollment.subject_code,
                    },
                ) {
                    eprintln!("Failed to insert enrollment into the database: {}", err);
                }
            }
        } else {
            eprintln!("No enrollments found in GraphQL response");
        }
    } else {
        eprintln!("No subjects found in GraphQL response");
    }
}
