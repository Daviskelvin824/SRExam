use cynic::{GraphQlResponse, QueryBuilder};
use mysql::{prelude::Queryable, Pool};
use tauri::State;
use crate::{model::Subjects, schema::GetAllSubject};

#[tauri::command]
pub fn getallsubject(mysql_pool: State<Pool>) -> Result<Vec<Subjects>, String> {
    let mut conn = mysql_pool.get_conn().expect("Failed to get connection.");
    let db_subjects = conn.query_map(
        "SELECT subject_code, subject_name FROM subjects",
        |(subject_code, subject_name)| Subjects {
            subject_code,
            subject_name,
        },
    ).map_err(|err| format!("Failed to fetch subjects: {}", err))?;

    if db_subjects.is_empty() {
        let subjects = match get_all_subject_from_graphql() {
            Ok(subjects) => subjects,
            Err(err) => return Err(format!("Failed to fetch subjects from GraphQL: {}", err)),
        };
        
        for subject in &subjects {
            conn.exec_drop(
                "INSERT INTO subjects (subject_code, subject_name) VALUES (?, ?)",
                (&subject.subject_code, &subject.subject_name),
            ).map_err(|err| format!("Failed to insert subject into database: {}", err))?;
        }
        
        return Ok(subjects);
    }

    Ok(db_subjects)
}

fn get_all_subject_from_graphql()->Result<Vec<Subjects>, Box<dyn std::error::Error>>{
    let operation = GetAllSubject::build({}); 
    let response = reqwest::blocking::Client::new()
        .post("https://academic-slc.apps.binus.ac.id/tpa-241/query")
        .json(&operation)
        .send()?;
    let graphql_response = response.json::<GraphQlResponse<GetAllSubject>>()?;
    if let Some(query_result) = graphql_response.data {
        let subjects: Vec<Subjects> = query_result
            .get_all_subject
            .into_iter()
            .map(|subject| Subjects {
                subject_code: subject.subject_code,
                subject_name: subject.subject_name,
            })
            .collect();
        Ok(subjects)
    } else {
        Err("No subjects found in GraphQL response".into())
    }
}




