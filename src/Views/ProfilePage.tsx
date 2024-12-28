import { useEffect, useState } from 'react'
import Layout from './Layout'
import { Avatar, Box, Container, Typography, TextField, Button } from '@mui/material'
import { invoke } from '@tauri-apps/api/tauri';
import User from '../model/User';
import { useNavigate } from 'react-router-dom';

const content = () =>{
    const navigate = useNavigate()
    const [currentUser, setCurrentUser] = useState<User|null>(null);
    const [oldPassword, setoldPassword] = useState("")
    const [newPassword, setnewPassword] = useState("")
    const [errorMessage, seterrorMessage] = useState("")
    const [confirmNewPassword, setconfirmNewPassword] = useState("")
    const [isSuccess, setisSuccess] = useState(Boolean)
    function get_curr_user(){
        invoke<User>('get_current_user').then((response:User)=>{
        if (response){
            setCurrentUser(response)
        }
        })
    }

    useEffect(() => {
      get_curr_user();
      // Scroll to top on component mount
      window.scrollTo(0, 0);
    }, []);

    function handleSubmit() {
        invoke('changepassword', {
            "oldpassword": oldPassword,
            "newpassword": newPassword,
            "confirmnewpassword": confirmNewPassword
        }).then((response) => {
            if (response === 'All Field must be filled !') {
                seterrorMessage(response);
                setisSuccess(false)
            } else if (response === "Confirm New Passoword must be the same as New Password !") {
                seterrorMessage(response);
                setisSuccess(false)
            } else if(response==="Old Password and New Password must not be the same !"){
                seterrorMessage(response);
                setisSuccess(false)
            } else if(response==="Old Password is incorrect"){
              seterrorMessage(response)
              setisSuccess(false)
            }
            else {
                seterrorMessage("Password changed successfully.");
                setisSuccess(true)
            }
        }).catch((error) => {
            // Handle unexpected errors
            seterrorMessage("An error occurred while processing your request.");
            console.error("Error: ", error);
        });
    }
    
    
    
    

    function handleLogout(){
        invoke('logoout')
        navigate("/")
    }

    return(
        <Box component='form' onSubmit={(e)=>{e.preventDefault(); handleSubmit();}}>
            <Box 
            height='100%'
            sx={(theme)=>({
                bgcolor:theme.palette.mode === 'light'
                ? 'rgba(255, 255, 255, 0.4)'
                : 'rgba(0, 0, 0, 0.4)',
                borderRadius: '10px',
                backdropFilter: 'blur(24px)',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow:
                theme.palette.mode === 'light'
                    ? `0 0 1px rgba(85, 166, 246, 0.1), 1px 1.5px 2px -1px rgba(85, 166, 246, 0.15), 4px 4px 12px -2.5px rgba(85, 166, 246, 0.15)`
                    : '0 0 1px rgba(2, 31, 59, 0.7), 1px 1.5px 2px -1px rgba(2, 31, 59, 0.65), 4px 4px 12px -2.5px rgba(2, 31, 59, 0.65)',
                pt: { xs: 4, sm: 3 },pb: { xs: 4, sm: 5 }
            })}
            >
            <Typography variant="h2" color="text.primary" sx={{pl: { xs: 3, sm: 3 }}}>
                Account Information
            </Typography>
            <Container maxWidth={false} sx={{pt: { xs: 4, sm: 2 }}}>
                <Avatar alt="" src="" sx={{ width: 100, height: 100 }}/>
                <Typography variant="h5" color="text.primary" sx={{pt: { xs: 4, sm: 2 }, fontWeight: 'normal'}}>
                    Binusian Number : {currentUser?.bn_number}
                </Typography>
                <Typography variant="h5" color="text.primary" sx={{pt: { xs: 4, sm: 1 }, fontWeight: 'normal'}}>
                    Name : {currentUser?.username}
                </Typography>
                <Typography variant="h5" color="text.primary" sx={{pt: { xs: 4, sm: 1 }, fontWeight: 'normal'}}>
                    Role : {currentUser?.role}
                </Typography>
                <Typography variant="h5" sx={{pt: { xs: 4, sm: 1 }, fontWeight: 'normal'}}>
                    {currentUser?.role === 'Student' 
                    ? `NIM : ${currentUser?.nim}`
                    : `Initial : ${currentUser?.initial}`
                }
                </Typography>
                <Typography variant="h5" color="text.primary" sx={{pt: { xs: 4, sm: 1 }, fontWeight: 'normal'}}>
                    Major : {currentUser?.major}
                </Typography>
              
            </Container>
            <Typography variant="h2" color="text.primary" sx={{pl: { xs: 3, sm: 3 },pt: { xs: 5, sm: 5 }}}>
                Change Password
            </Typography>
            <Container maxWidth={false} sx={{pt: { xs: 4, sm: 2 }}}>
              <Typography variant="h5" color="text.primary" sx={{pt: { xs: 4, sm: 1 }, fontWeight: 'normal'}}>
                Old Password
              </Typography>
              <TextField
                margin='normal'
                type='password'
                id="outlined-basic"
                hiddenLabel
                placeholder='Old Password'
                variant="outlined"
                value={oldPassword}
                onChange={(e) => setoldPassword(e.target.value)}
                sx={{pt: { xs: 4, sm: 1 } }}
                autoFocus
              />
              <br />
              <Typography variant="h5" color="text.primary" sx={{pt: { xs: 4, sm: 1 }, fontWeight: 'normal'}}>
                New Password
              </Typography>
              <TextField
                margin='normal'
                id="outlined-basic"
                type='password'
                hiddenLabel
                placeholder='New Password'
                variant="outlined"
                value={newPassword}
                onChange={(e) => setnewPassword(e.target.value)}
                sx={{pt: { xs: 4, sm: 1 } }}
                autoFocus
              />
              <br />
              <Typography variant="h5" color="text.primary" sx={{pt: { xs: 4, sm: 1 }, fontWeight: 'normal'}}>
                Confirm New Password
              </Typography>
              <TextField
                margin='normal'
                id="outlined-basic"
                type='password'
                hiddenLabel
                placeholder='Confirm New Password'
                variant="outlined"
                value={confirmNewPassword}
                onChange={(e) => setconfirmNewPassword(e.target.value)}
                sx={{pt: { xs: 4, sm: 1 } }}
                autoFocus
              />
            </Container>
            <Typography 
              variant="body1" 
              color={isSuccess ? "green" : "red"}
              sx={{pl: { xs: 4, sm: 3 } }}
              >
                {errorMessage}
              </Typography>
            <Button variant="contained" color="primary" sx={{mt: { xs: 4, sm: 2 }, ml: { xs: 4, sm: 3 }, padding: '16px 44px' }} type='submit'>
              Submit
            </Button>
            <Typography variant="h2" color="text.primary" sx={{pl: { xs: 3, sm: 3 },pt: { xs: 5, sm: 5 }}}>
                Logout
            </Typography>
            <Button variant="contained" color="primary" sx={{mt: { xs: 4, sm: 3 }, ml: { xs: 4, sm: 3 }, padding: '16px 44px' }} onClick={handleLogout}>
              Logout
            </Button>
            </Box>
          
        </Box>
    )
}


const ProfilePage = () => {
  return (
    <Layout content={content()}/>
  )
}

export default ProfilePage