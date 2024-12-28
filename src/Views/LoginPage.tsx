import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import logo from "../assets/SRExam-Logo.png"
import ParticlesComponent from '../components/particles/particles'
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/tauri';
import Typography from '@mui/material/Typography'
import User from '../model/User';
const LoginPage = () => {
    const [username, setusername] = useState("")
    const [password, setpassword] = useState("")
    const [errorMessage, seterrorMessage] = useState("")
    const navigate = useNavigate()
    function login(){
      invoke('login',{"username":username, "password": password}).then((response) => {
        if(response === false){ 
          seterrorMessage("Invalid Credential!")
        } else {
          invoke<User>('get_current_user').then((response:User)=>{
            if (response){
              if (response.role.toString() === "Student"){
                navigate('/homepagestudent')
              } else if(response.role.toString() === "Assistant"){
                navigate('/homepageassistant')
              } else if(response.role.toString() === "Subject Development"){
                navigate('/homepagesubdev')
              } else {
                navigate('/homepageexamcoor')
              }
            }
          })
          
        }
      }).catch((error:any) => {
        seterrorMessage("All Field Must be Filled!");
        console.error("Error: ",error)
      })
    }
    
    function check_status_exam(){
      invoke('get_all_transaction')
    }

    useEffect(()=>{
      check_status_exam()
    },[])


    return (
          <Container component="main" maxWidth="xs" sx={{
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            <ParticlesComponent/>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding:'30px',
                borderRadius:'10px',
                bgcolor: 'white',
                
              }}
            >
              
            <img src={logo} alt="" className='w-28 h-auto'/>
            <Box component="form" noValidate onSubmit={(e)=>{e.preventDefault(); login();}} >
              <TextField
                margin="normal"
                fullWidth
                id="username"
                label="Username"
                name="email"
                autoComplete="username"
                value={username}
                onChange={(e) => setusername(e.target.value)}
                autoFocus
              />
              <TextField
                margin="normal"
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                value={password}
                onChange={(e) => setpassword(e.target.value)}
                autoComplete="current-password"
              />
              <Typography 
              variant="body1" 
              color="red" 
              textAlign={'center'}
              >
                {errorMessage}
              </Typography>
              
              <Button
                type='submit'
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Sign In
              </Button>
            
            </Box>
              
            </Box>
          </Container>
      );
}

export default LoginPage