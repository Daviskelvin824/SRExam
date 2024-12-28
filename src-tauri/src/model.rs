
use std::sync::Mutex;

use serde::{Deserialize, Serialize};

#[derive(Serialize,Deserialize,Clone,Debug)]
pub struct Users{
    pub bn_number : String,
    pub username : String,
    pub nim : String,
    pub password : String,
    pub role : String,
    pub major : String,
    pub initial : Option<String>
}
#[derive(Serialize,Deserialize)]
pub struct CurrentUser{
    pub user:Mutex<Option<Users>>
}   

pub struct MySQLConfig{
    pub user: String,
    pub password:String,
    pub host:String,
    pub database:String
}

impl MySQLConfig {
    // pub fn new(user:String,password:String,host:String,database:String)->Self {
    //     return Self { user, password, host, database};
    // }

    pub fn format_url(&self)->String {
        return format!("mysql://{}:{}@{}/{}",
            self.user,
            self.password,
            self.host,
            self.database
        )
    }
}

#[derive(Serialize,Deserialize,Clone,Debug)]
pub struct Subjects{
    pub subject_code:String,
    pub subject_name:String
}

#[derive(Serialize,Deserialize,Clone,Debug)]
pub struct Enrollments{
    pub class_code:String,
    pub nim:String,
    pub subject_code:String
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Rooms {
    pub campus: String,
    pub room_capacity: i32,
    pub room_number: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TransactionHeader {
    pub transactionid:String,
    pub subject_code: String,
    pub shift_number: String,
    pub transactiondate: String,
    pub room_number: String,
    pub proctor: Option<String>,
    pub status:String,
    pub subject_name: String,
}
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ReportHeader {
    pub transactionid:String,
    pub subject_code:String,
    pub subject_name:String,
    pub shift_number:String,
    pub transactiondate:String,
    pub room_number:String,
    pub proctor:String
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ReportDetail {
    pub transactionid:String,
    pub nim:String,
    pub name:String,
    pub seat_number:String,
    pub markreason:String,
    pub evidencephoto:Vec<u8>
}