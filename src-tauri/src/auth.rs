
use cynic::{GraphQlResponse, QueryBuilder};
use tauri::State;
use mysql::{params, prelude::Queryable, Pool};
use bcrypt::{hash, DEFAULT_COST};
use crate::{model::{CurrentUser, Users}, schema::{User, UserArgumentsByNIM,UserArgumentsByInitial, UserQueryByInitial, UserQueryByNIM}};
use std::string::String;

#[tauri::command]
pub fn login(username: &str, password: &str, mysql_pool: State<Pool>, current_user: State<CurrentUser>) -> Result<bool, String> {
    if username.is_empty() || password.is_empty() {
        return Err("Username and password are required".to_string());
    }
    let mut conn = mysql_pool.get_conn().expect("Failed to get connection.");

    let db_user: Option<(String, String)> = conn.exec_first("SELECT password,role FROM users WHERE nim = :username OR initial = :username", params! {
        "username" => username.to_uppercase(),
    }).expect("Invalid Credential");

    if let Some((db_password, _db_role)) = db_user {
        if bcrypt::verify(password, &db_password).unwrap_or(false) {
            if password.len()==10{
                let result: Option<(String, String, String, String, String, String, Option<String>)> = conn.exec_first("SELECT bn_number, username, nim, password, role, major, initial FROM users WHERE nim = :username", params! {
                    "username" => username.to_uppercase(),
                }).map_err(|err| format!("Failed to execute query: {}", err))?;
                println!("{:?}",result);
                if let Some((bn_number, username, nim, password, role, major, initial)) = result {
                    let user = Users {
                        bn_number,
                        username,
                        nim,
                        password,
                        role,
                        major,
                        initial,
                    };

                    // Update current_user
                    current_user.user.lock().unwrap().replace(user);

                    Ok(true)
                } else {
                    Ok(false)
                }
            }else{
                let result: Option<(String, String, String, String, String, String, Option<String>)> = conn.exec_first("SELECT bn_number, username, nim, password, role, major, initial FROM users WHERE initial = :username", params! {
                    "username" => username.to_uppercase(),
                }).map_err(|err| format!("Failed to execute query: {}", err))?;
                println!("{:?}",result);
                if let Some((bn_number, username, nim, password, role, major, initial)) = result {
                    let user = Users {
                        bn_number,
                        username,
                        nim,
                        password,
                        role,
                        major,
                        initial,
                    };

                    // Update current_user
                    current_user.user.lock().unwrap().replace(user);

                    Ok(true)
                } else {
                    Ok(false)
                }
            }
            // Handle the result and continue with the login process
        } else {
            Ok(false)
        }
    } else {
        // No user found with the provided username
        match send_request(username) {
            Ok(user_data) => {
                println!("User data: {:?}", user_data);
                let hashed_password = hash(username, DEFAULT_COST).expect("Failed to hash password");
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
                        let result: Option<(String, String, String, String, String, String, Option<String>)> = conn.exec_first("SELECT bn_number, username, nim, password, role, major, initial FROM users WHERE nim = :username OR initial = :username", params! {
                            "username" => username.to_uppercase(),
                        }).map_err(|err| format!("Failed to execute query: {}", err))?;
                        if let Some((bn_number, username, nim, password, role, major,initial)) = result {
                            let user = Users {
                                bn_number,
                                username,
                                nim,
                                password,
                                role,
                                major,
                                initial
                            };
                    
                            // Update current_user
                            current_user.user.lock().unwrap().replace(user);
                        }
                        Ok(true)
                    },
                    Err(err) => {
                        println!("Failed to insert user into database: {}", err);
                        Err(format!("Failed to insert user into database: {}", err))
                    },
                }
            },
            Err(err) => {
                println!("Error: {}", err);
                Ok(false)
            }
        }
            
        
    }
}


#[tauri::command]
pub fn get_current_user(current_user:State<CurrentUser>)->Option<Users> {
    return current_user.user.lock().unwrap().clone();
}

fn send_request(nim:&str) -> Result<User, Box<dyn std::error::Error>> {
    if nim.len()==10{
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
    }else{
        let operation = UserQueryByInitial::build(UserArgumentsByInitial{
            initial:nim.into(),
        }); 
        let response = reqwest::blocking::Client::new()
        .post("https://academic-slc.apps.binus.ac.id/tpa-241/query")
        .json(&operation)
        .send()?;

        let graphql_response = response.json::<GraphQlResponse<UserQueryByInitial>>()?;
        if let Some(user_query) = graphql_response.data {
            let user_struct = User{
                bn_number: user_query.get_user_by_initial.bn_number,
                name: user_query.get_user_by_initial.name,
                nim: user_query.get_user_by_initial.nim,
                role: user_query.get_user_by_initial.role,
                major: user_query.get_user_by_initial.major,
                initial: user_query.get_user_by_initial.initial,  
            };
        Ok(user_struct)
        }else {
            Err("No data returned from the GraphQL response".into())
        }
    }

   
}

#[tauri::command]
pub fn logout(current_user: State<CurrentUser>){
    *current_user.user.lock().unwrap() = None;
}

#[tauri::command]
pub fn changepassword(oldpassword:&str, newpassword:&str,confirmnewpassword:&str,mysql_pool: State<Pool>,current_user: State<CurrentUser>)->String {
    if oldpassword.is_empty() || newpassword.is_empty() || confirmnewpassword.is_empty() {
        return "All Field must be filled !".to_string();
    }
    else if newpassword != confirmnewpassword{
        return "Confirm New Passoword must be the same as New Password !".to_string();
    }
    else if oldpassword == newpassword{
        return "Old Password and New Password must not be the same !".to_string();
    }
    else{

        let mut conn = mysql_pool.get_conn().expect("Failed to get connection.");
        let username = {
            let user = current_user.user.lock().unwrap();
            user.as_ref().expect("No user logged in").nim.clone()
        };
        let db_password: Option<String> = conn.exec_first("SELECT password FROM users WHERE nim = :username OR initial = :username", params! {
            "username" => username.to_uppercase(),
        }).expect("Invalid Credential");
        if let Some(db_password) = db_password {
            if bcrypt::verify(oldpassword, &db_password).unwrap_or(false) {
                let hashed_password = hash(newpassword, DEFAULT_COST).expect("Failed to hash password");
                let _ = conn.exec_drop(
                    "UPDATE users SET password = :new_password WHERE nim = :username OR initial = :username",
                    params! {
                        "new_password" => hashed_password,
                        "username" => username.to_uppercase(),
                    },
                ).expect("Failed to update password");
                return "Password changed successfully".to_string();
            } else {
                // Password does not match
                return "Old Password is incorrect".to_string();
            }
        } else {
            // No user found in the database
            return "User not found".to_string();
        }
    }
}

#[tauri::command]
pub fn get_all_registered_user(mysql_pool: State<Pool>) -> Result<Vec<Users>, String> {
    let mut conn = mysql_pool.get_conn().map_err(|err| format!("Failed to get connection: {}", err))?;

    let db_users = conn.query_map(
        "SELECT bn_number, username, nim, password, role, major, initial FROM users",
        |(bn_number, username, nim, password, role, major, initial)| Users {
            bn_number,
            username,
            nim,
            password,
            role,
            major,
            initial,
        },
    ).map_err(|err| format!("Failed to fetch users: {}", err))?;

    Ok(db_users)
}

#[tauri::command]
pub fn change_role(nim:&str, role:&str, initial:&str,mysql_pool: State<Pool>) -> String{
    if(role == ""){
        return "Please pick a Role !".to_string();
    }
    else{
        let mut conn = mysql_pool.get_conn().expect("Failed to get connection.");
        let db_role: Option<String> = conn.exec_first("SELECT role FROM users WHERE nim = :username", params! {
            "username" => nim.to_uppercase(),
        }).expect("Invalid Credential");
        if let Some(db_role) = db_role {
            if db_role == role{
                return "Cannot be the same Role !".to_string();
            }
            else if(role=="Student"){
                conn.exec_drop("UPDATE users SET role = 'Student' WHERE nim = :username", params! {
                    "username" => nim.to_uppercase(),
                }).expect("Failed to update user role.");
                
                conn.exec_drop("UPDATE users SET initial = NULL WHERE nim = :username", params! {
                    "username" => nim.to_uppercase(),
                }).expect("Failed to set initial to null.");

                let hashed_password = hash(nim, DEFAULT_COST).expect("Failed to hash password");
                let hashed_pass_string:String = hashed_password;
                conn.exec_drop("UPDATE users SET password = :nim WHERE nim = :username", params! {
                    "username" => nim.to_uppercase(),
                    "nim" => hashed_pass_string,
                }).expect("Failed to set password to NIM.");
                return "Success".to_string();
            }else{
                if(db_role=="Student"){
                    if(initial==""){
                        return "Initial must be filled".to_string();
                    }else{
                        conn.exec_drop("UPDATE users SET role = :role WHERE nim = :username", params! {
                            "username" => nim.to_uppercase(),
                            "role" => role
                        }).expect("Failed to update user role.");

                        conn.exec_drop("UPDATE users SET initial = :initial WHERE nim = :username", params! {
                            "username" => nim.to_uppercase(),
                            "initial" => initial
                        }).expect("Failed to set initial to null.");
                        
                        let hashed_password = hash(initial, DEFAULT_COST).expect("Failed to hash password");
                        let hashed_pass_string:String = hashed_password;
                        conn.exec_drop("UPDATE users SET password = :initial WHERE nim = :username", params! {
                            "username" => nim.to_uppercase(),
                            "initial" => hashed_pass_string,
                        }).expect("Failed to set password to NIM.");
                        return "Success".to_string();
                    }
                }else{
                    conn.exec_drop("UPDATE users SET role = :role WHERE nim = :username", params! {
                        "username" => nim.to_uppercase(),
                        "role" => role
                    }).expect("Failed to update user role.");
                    return "Success".to_string();
                }
            }
        } else {
            return "Failed".to_string();
        }

    
    }
}

