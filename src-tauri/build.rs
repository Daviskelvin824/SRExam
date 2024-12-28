fn main() {
    cynic_codegen::register_schema("srexams")
        .from_sdl_file("schemas/srexam.graphql")
        .unwrap()
        .as_default()
        .unwrap();
   
    tauri_build::build()
}
