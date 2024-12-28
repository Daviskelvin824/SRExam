import React, { useEffect, useState } from 'react';
import Layout from '../Layout';
import { Box, Typography, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, TablePagination, TextField, FormControl, InputLabel, Select, MenuItem, Popover, Button, FormLabel, FormHelperText } from '@mui/material';
import { invoke } from '@tauri-apps/api/tauri';
import User from '../../model/User';

const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [changeRole, setchangeRole] = useState('')
  const [changeInitial, setchangeInitial] = useState('')
  const [errorMessage, seterrorMessage] = useState('')
  const [isSuccess, setisSuccess] = useState(Boolean)
  const fetchUsers = async () => {
    try {
      const response = await invoke<User[]>('get_all_registered_user');
      setUsers(response || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Apply filtering based on search term and role
    const filtered = users.filter(user => {
      const nameMatch = user.username.toLowerCase().includes(searchTerm.toLowerCase());
      const initialMatch = user.initial?.toLowerCase().includes(searchTerm.toLowerCase());
      const nimMatch = user.nim.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatch = !filterRole || user.role.toLowerCase() === filterRole.toLowerCase();
      return (nameMatch || initialMatch || nimMatch) && roleMatch;
    });
    setFilteredUsers(filtered);
    setPage(0); // Reset page when filtering changes
  }, [users, searchTerm, filterRole]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClick = (event: any, userId: any) => {
    setSelectedUserId(userId);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    seterrorMessage("")
  };

  function handleChangeRole(nim:String){
    invoke('change_role',{"nim":nim, "role": changeRole,"initial": changeInitial}).then((response:any)=>{
        if(response === "Success"){
            seterrorMessage("Success")
            setisSuccess(true)
        }else{
            seterrorMessage(response)
            setisSuccess(false)
        }
    })
  }

  return (
    <Layout content={
      <Box minHeight="100vh">
        <Typography variant="h1" color="text.primary" textAlign="left">User Management</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 4, marginTop: 5 }}>
          <TextField
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ marginRight: 2 }}
            placeholder='Search by Name/NIM/Initial'
          />
          <FormControl variant="outlined" size="small">
            <InputLabel>Filter by Role</InputLabel>
            <Select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as string)}
              sx={{width:"10vw"}}
              
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="assistant">Assistant</MenuItem>
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="subject development">Subdev</MenuItem>
              <MenuItem value="exam coordinator">Exam Coordinator</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>NIM</TableCell>
                <TableCell>Initial</TableCell>
                <TableCell>BN Number</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user, index) => (
                <TableRow key={index}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.nim}</TableCell>
                  <TableCell>{user.initial ?? '-'}</TableCell>
                  <TableCell>{user.bn_number}</TableCell>
                  <TableCell>
                  <Button onClick={(e) => handleClick(e, user.nim)}>
                    Change Role
                    </Button>
                    <Popover
                      open={!!anchorEl && selectedUserId === user.nim}
                      anchorEl={anchorEl}
                      onClose={handleClose}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                      }}
                    >
                      <Box component="form" p={2} sx={{ display: 'flex', alignItems: 'left', justifyContent: 'flex-start', flexDirection: 'column'}} onSubmit={(e)=>{e.preventDefault(); handleChangeRole(user.nim);}}>
                        <Typography sx={{pb:2}}>{user.username}</Typography>
                        <FormControl variant="outlined" size="small" sx={{minWidth:"10vw"}}>
                            <InputLabel>Pick a Role</InputLabel>
                            <Select
                                placeholder='Pick a Role'
                                onChange={(e) => setchangeRole(e.target.value as string)}
                            >
                                <MenuItem value="Assistant">Assistant</MenuItem>
                                <MenuItem value="Student">Student</MenuItem>
                                <MenuItem value="Subject Development">Subdev</MenuItem>
                                <MenuItem value="Exam Coordinator">Exam Coordinator</MenuItem>
                            </Select>
                        </FormControl>
                        {(changeRole === "Assistant" || changeRole==="Subject Development" || changeRole==="Exam Coordinator") && user.role==="Student"? (
                            <TextField
                                id=""
                                placeholder='Initial'
                                value={changeInitial}
                                onChange={(e) => setchangeInitial(e.target.value)}
                                sx={{mt:3}}
                            />
                        ) : null}
                        <Typography 
                        variant="body1" 
                        color={isSuccess ? "green" : "red"}
                        
                        textAlign="left"
                        >
                            {errorMessage}
                        </Typography>
                        <Button variant="contained" color="primary" sx={{mt:3}} type='submit'>
                          Submit
                        </Button>
                      </Box>
                    </Popover>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    } />
  );
}

export default UserManagementPage;
