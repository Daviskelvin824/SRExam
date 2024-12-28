import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import { PaletteMode } from '@mui/material';
import { useEffect, useState } from 'react';
import User from '../model/User';
import { invoke } from '@tauri-apps/api/tauri';
import logo from "../assets/SRExam-Logo.png"
import { useNavigate } from 'react-router-dom';
const pagesByRole: Record<string, string[]> = {
  'Student': ['Home'],
  'Assistant': ['Home'],
  'Subject Development': ['Home', 'View all Transaction', 'View all Schedule', 'Subject Management', 'Report Management'],
  'Exam Coordinator': ['Home', 'View all Transaction', 'View all Schedule', 'Exam Scheduler', 'Subject Management', 'User Management', 'Room Management', 'Report Management']
};
const settings = ['Profile', 'Logout'];
interface NavbarProps {
  mode: PaletteMode;
}
function Navbar() {
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [currentUser, setCurrentUser] = useState<User|null>(null);
  const navigate = useNavigate()
  function get_curr_user(){
    invoke<User>('get_current_user').then((response:User)=>{
      if (response){
        setCurrentUser(response)
      }
    })
  }

  useEffect(() => {
    get_curr_user();
  }, []);

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    invoke('logout')
    navigate("/")
  };

  const handleProfile = () =>{
    navigate("/profilepage")
  }

  function handleStudent(arg:String){
    if (arg==="Home"){
      navigate("/homepagestudent")
    }
  }

  function handleAssistant(arg:any){
    if(arg==="Home"){
      navigate("/homepageassistant")
    }
  }

  function handleSubdev(arg:any){
    if(arg==="Home"){
      navigate("/homepagesubdev")
    }
    else if(arg==="Subject Management"){
      navigate("/subjectmanagementpage")
    }
    else if(arg==="View all Transaction"){
      navigate("/viewtransactionpage")
    }
    else if(arg === "Report Management"){
      navigate("/reportmanagementpage")
    }
  }

  function handleExamcoor(arg:any){
    if(arg==="Home"){
      navigate("/homepageexamcoor")
    }
    else if(arg === "Subject Management"){
      navigate("/subjectmanagementpage")
    }
    else if(arg==="User Management"){
      navigate("/usermanagementpage")
    }
    else if(arg==="Exam Scheduler"){
      navigate("/examschedulerpage")
    }
    else if(arg==="View all Transaction"){
      navigate("/viewtransactionpage")
    }
    else if(arg === "View all Schedule"){
      navigate("/viewschedulepage")
    }
    else if(arg === "Room Management"){
      navigate("/roommanagementpage")
    }
    else if(arg === "Report Management"){
      navigate("/reportmanagementpage")
    }
  }

  return (
    <AppBar position="fixed" sx={{
        boxShadow: 0,
        bgcolor: 'transparent',
        backgroundImage: 'none',
        mt: 2,
      }}>
      <Container maxWidth={false} >
          <Toolbar
            variant="regular"
            sx={(theme) => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              borderRadius: '999px',
              bgcolor:
                theme.palette.mode === 'light'
                  ? 'rgba(255, 255, 255, 0.4)'
                  : 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(24px)',
              maxHeight: 40,
              border: '1px solid',
              borderColor: 'divider',
              boxShadow:
                theme.palette.mode === 'light'
                  ? `0 0 1px rgba(85, 166, 246, 0.1), 1px 1.5px 2px -1px rgba(85, 166, 246, 0.15), 4px 4px 12px -2.5px rgba(85, 166, 246, 0.15)`
                  : '0 0 1px rgba(2, 31, 59, 0.7), 1px 1.5px 2px -1px rgba(2, 31, 59, 0.65), 4px 4px 12px -2.5px rgba(2, 31, 59, 0.65)',
            })}
          >
            <img
            src={logo}
            alt=""
            className='w-10 h-auto hidden md:flex mr-1'
            />
          

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
              }}
            >
              {pagesByRole[currentUser?.role as keyof typeof pagesByRole]?.map((page: string, index: number) => (
                <MenuItem key={index} onClick={() => currentUser?.role == "Student"? handleStudent(page) : currentUser?.role == "Assistant"? handleAssistant(page) :currentUser?.role == "Subject Development"? handleSubdev(page) :currentUser?.role == "Exam Coordinator"? handleExamcoor(page)  :handleCloseNavMenu}>
                  <Typography textAlign="center" color="text.primary">{page}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {currentUser?.role === 'Student' ? (
              <React.Fragment>
                <MenuItem onClick={() => handleStudent("Home")} sx={{ py: '6px', px: '20px' }}>
                  <Typography variant="body2" color="text.primary">
                    Home
                  </Typography>
                </MenuItem>
                
              </React.Fragment>
            ) : currentUser?.role === 'Assistant' ? (
              <React.Fragment>
                <MenuItem onClick={() => handleAssistant("Home")} sx={{ py: '6px', px: '20px' }}>
                  <Typography variant="body2" color="text.primary">
                    Home
                  </Typography>
                </MenuItem>
                
              </React.Fragment>
            ) : currentUser?.role === 'Subject Development' ? (
              // Add menu items for Role3
              <React.Fragment>
                <MenuItem onClick={() => handleSubdev("Home")}  sx={{ py: '6px', px: '20px' }}>
                  <Typography variant="body2" color="text.primary">
                    Home
                  </Typography>
                </MenuItem>
                <MenuItem sx={{ py: '6px', px: '20px' }}>
                  <Typography variant="body2" color="text.primary" onClick={() => handleSubdev("View all Transaction")}>
                    View all Transaction
                  </Typography>
                </MenuItem>
                <MenuItem sx={{ py: '6px', px: '20px' }} onClick={() => handleSubdev("View all Schedule")}>
                  <Typography variant="body2" color="text.primary">
                    View all Schedule
                  </Typography>
                </MenuItem>
                <MenuItem sx={{ py: '6px', px: '20px' }} onClick={() => handleSubdev("Subject Management")}>
                  <Typography variant="body2" color="text.primary">
                    Subject Management
                  </Typography>
                </MenuItem>
                <MenuItem sx={{ py: '6px', px: '20px' }} onClick={() => handleSubdev("Report Management")}>
                  <Typography variant="body2" color="text.primary">
                    Report Management
                  </Typography>
                </MenuItem>
              </React.Fragment>
            ) : (
              // Add menu items for Role4
              <React.Fragment>
                <MenuItem onClick={() => handleExamcoor("Home")}  sx={{ py: '6px', px: '20px' }}>
                  <Typography variant="body2" color="text.primary">
                    Home
                  </Typography>
                </MenuItem>
                <MenuItem sx={{ py: '6px', px: '20px' }}>
                  <Typography variant="body2" color="text.primary" onClick={() => handleExamcoor("View all Transaction")}>
                    View all Transaction
                  </Typography>
                </MenuItem>
                <MenuItem sx={{ py: '6px', px: '20px' }} onClick={() => handleExamcoor("View all Schedule")}>
                  <Typography variant="body2" color="text.primary">
                    View all Schedule
                  </Typography>
                </MenuItem>
                <MenuItem onClick={() => handleExamcoor("Exam Scheduler")} sx={{ py: '6px', px: '20px' }}>
                  <Typography variant="body2" color="text.primary">
                    Exam Scheduler
                  </Typography>
                </MenuItem>
                <MenuItem onClick={() => handleExamcoor("Subject Management")} sx={{ py: '6px', px: '20px' }}>
                  <Typography variant="body2" color="text.primary">
                    Subject Management
                  </Typography>
                </MenuItem>
                <MenuItem onClick={() => handleExamcoor("User Management")} sx={{ py: '6px', px: '20px' }}>
                  <Typography variant="body2" color="text.primary">
                    User Management
                  </Typography>
                </MenuItem>
                <MenuItem sx={{ py: '6px', px: '20px' }} onClick={() => handleExamcoor("Room Management")}>
                  <Typography variant="body2" color="text.primary">
                    Room Management
                  </Typography>
                </MenuItem>
                <MenuItem sx={{ py: '6px', px: '20px' }} onClick={() => handleExamcoor("Report Management")}>
                  <Typography variant="body2" color="text.primary">
                    Report Management
                  </Typography>
                </MenuItem>
              </React.Fragment>
            )}
          </Box>


          <Box>
            <Typography variant="body2" textAlign="right">{currentUser?.role === 'Student' ? currentUser?.nim : currentUser?.initial}</Typography>
            <Typography variant="body2" textAlign="right">{currentUser?.username}</Typography>
          </Box>
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Open settings">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0, marginLeft:2}}>
                <Avatar alt="" src="" />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              {settings.map((setting) => (
                <MenuItem key={setting} onClick={setting === 'Logout' ? handleLogout : setting === 'Profile' ? handleProfile : handleCloseUserMenu}>
                  <Typography textAlign="center" color="text.primary">{setting}</Typography>
                </MenuItem>
              ))}
            </Menu>
              
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default Navbar;