use self::schema::ID;
#[cynic::schema("srexams")]
mod schema {}
#[derive(cynic::QueryFragment, Debug)]
pub struct User {
    #[cynic(rename = "bn_number")]
    pub bn_number: ID,
    pub initial: Option<String>,
    pub major: String,
    pub name: String,
    pub nim: String,
    pub role: String,
}
// by nim
#[derive(cynic::QueryVariables)]
pub struct UserArgumentsByNIM {
    pub nim: String,
}

#[derive(cynic::QueryFragment, Debug)]
#[cynic(graphql_type = "Query", variables = "UserArgumentsByNIM")]
pub struct UserQueryByNIM {
    #[arguments(nim: $nim)]
    #[cynic(rename = "getUserByNIM")]
    pub get_user_by_nim: User,
}

// By initial
#[derive(cynic::QueryVariables)]
pub struct UserArgumentsByInitial {
    pub initial: String,
}

#[derive(cynic::QueryFragment, Debug)]
#[cynic(graphql_type = "Query", variables = "UserArgumentsByInitial")]
pub struct UserQueryByInitial {
    #[arguments(initial: $initial)]
    #[cynic(rename = "getUserByInitial")]
    pub get_user_by_initial: User,
}

// Subjects
#[derive(cynic::QueryFragment, Debug)]
pub struct Subject {
    #[cynic(rename = "subject_code")]
    pub subject_code: String,
    #[cynic(rename = "subject_name")]
    pub subject_name: String,
}

#[derive(cynic::QueryFragment, Debug)]
#[cynic(graphql_type = "Query")]
pub struct GetAllSubject {
    pub get_all_subject: Vec<Subject>,
}


#[derive(cynic::QueryFragment, Debug)]
pub struct Enrollment {
    #[cynic(rename = "class_code")]
    pub class_code: String,
    #[cynic(rename = "subject_code")]
    pub subject_code: String,
    pub nim: String,
}

#[derive(cynic::QueryFragment, Debug)]
#[cynic(graphql_type = "Query")]
pub struct GetAllEnrollment {
    pub get_all_enrollment: Option<Vec<Option<Enrollment>>>,
}

#[derive(cynic::QueryFragment, Debug)]
#[cynic(graphql_type = "Query")]
pub struct GetAllRooms {
    pub get_all_room: Vec<Room>,
}

#[derive(cynic::QueryFragment, Debug)]
pub struct Room {
    pub campus: String,
    #[cynic(rename = "room_capacity")]
    pub room_capacity: i32,
    #[cynic(rename = "room_number")]
    pub room_number: String,
}


#[derive(cynic::QueryVariables)]
pub struct GetStudentsByClassAndSubjectCodeArg {
    pub class_code: String,
    pub subject_code: String,
}
#[derive(cynic::QueryFragment, Debug)]
#[cynic(graphql_type = "Query",variables = "GetStudentsByClassAndSubjectCodeArg")]
pub struct GetStudentsByClassAndSubjectCode {
    #[arguments(class_code: $class_code, subject_code: $subject_code)]
    pub get_students_by_class_and_subject_code: Option<Vec<String>>,
}








