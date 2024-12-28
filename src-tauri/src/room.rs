use cynic::{GraphQlResponse, QueryBuilder};
use mysql::{params, prelude::Queryable, Pool};
use tauri::State;

use crate::{model::Rooms, schema::GetAllRooms};

#[tauri::command]
pub fn get_all_rooms(mysql_pool: State<Pool>)-> Result<Vec<Rooms>, String>{
    let mut conn = mysql_pool.get_conn().expect("Failed to get Connection!");
    let db_rooms = conn.query_map(
        "SELECT campus, room_capacity, room_number FROM rooms",
        |(campus, room_capacity, room_number)| Rooms {
            campus,
            room_capacity,
            room_number,
        },
    ).map_err(|err| format!("Failed to fetch subjects: {}", err))?;
    if db_rooms.is_empty() {
        let rooms = match get_all_rooms_from_graphql() {
            Ok(rooms) => rooms,
            Err(err) => return Err(format!("Failed to fetch subjects from GraphQL: {}", err)),
        };
        
        for room in &rooms {
            conn.exec_drop(
                "INSERT INTO rooms (campus, room_capacity, room_number) VALUES (?, ?, ?)",
                (&room.campus, &room.room_capacity, &room.room_number),
            ).map_err(|err| format!("Failed to insert subject into database: {}", err))?;
        }
        
        return Ok(rooms);
    }
    println!("{:?}",db_rooms);
    Ok(db_rooms)
}

fn get_all_rooms_from_graphql()->Result<Vec<Rooms>, Box<dyn std::error::Error>>{
    let operation = GetAllRooms::build({}); 
    let response = reqwest::blocking::Client::new()
        .post("https://academic-slc.apps.binus.ac.id/tpa-241/query")
        .json(&operation)
        .send()?;
    let graphql_response = response.json::<GraphQlResponse<GetAllRooms>>()?;
    if let Some(query_result) = graphql_response.data {
        let rooms: Vec<Rooms> = query_result
            .get_all_room
            .into_iter()
            .map(|room| Rooms {
                campus: room.campus,
                room_capacity: room.room_capacity,
                room_number: room.room_number,
            })
            .collect();
        Ok(rooms)
    } else {
        Err("No subjects found in GraphQL response".into())
    }
}

#[tauri::command]
pub fn get_room_by_date(date:&str,mysql_pool: State<Pool>)->Result<Vec<Vec<String>>, String>{
    let mut conn = mysql_pool.get_conn().expect("Failed to get Connection!");
    let db_rooms: Result<Vec<Vec<String>>, mysql::Error> = conn.exec_map(
        "SELECT r.room_number, room_capacity, campus, transactiondate, shift_number, transactionid FROM transactionheader th JOIN rooms r ON th.room_number = r.room_number WHERE transactiondate = :date ",
        params!{"date" => date},
        |(room_number, room_capacity, campus, transactiondate, shift_number,transactionid): (String, i32, String, String, String,String)| { 
            vec![room_number, room_capacity.to_string(), campus, transactiondate, shift_number,transactionid]
        },
    );
    
    match &db_rooms {
        Ok(data) => {
            println!("Data retrieved from the database: {:?}", data);
        
        }
        Err(err) => {
            println!("Error retrieving data from the database: {}", err);
        }
    }
    
    db_rooms.map_err(|err| err.to_string())
}
