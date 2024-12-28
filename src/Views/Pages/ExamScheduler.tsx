import React, { useEffect, useState } from 'react';
import Layout from '../Layout';
import { Tabs, Tab, Box, Typography, Select, FormControl, FormLabel, FormHelperText, InputLabel, MenuItem, TextField, Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Checkbox } from '@mui/material';
import { invoke } from '@tauri-apps/api/tauri';
import Subjects from '../../model/subject';
import TransactionHeader from '../../model/transctionheader';
import User from '../../model/User';

const ExamScheduler = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [subjects, setSubjects] = useState<Subjects[]>([]);
  const [classcode, setClasscode] = useState<string[]>([])
  const [rooms, setRooms] = useState<Rooms[]>([]);
  const [selectedSubject, setselectedSubject] = useState('')
  const [selectedClass, setSelectedClass] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [errorMessage, seterrorMessage] = useState('')
  const [errorMessage2, seterrorMessage2] = useState('')
  const [failedAssigned, setfailedAssigned] = useState<String[]>([])
  const [failedAssigned2, setfailedAssigned2] = useState<String[]>([])
  const [isSuccess, setisSuccess] = useState(Boolean)
  const [openPopup, setOpenPopup] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [transactionHeader, settransactionHeader] = useState<TransactionHeader[]>([])
  const [selectedTransaction, setSelectedTransaction] = useState<string[]>([]);
  const [assistant, setAssistant] = useState<User[]>([])
  const [selectedAssistant, setSelectedAssistant] = useState<string[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState<string[]>([]);
  const [showSubmitButton, setShowSubmitButton] = useState(true);
  const uniqueSubjectNames = Array.from(new Set(subjects.map(subject => subject.subject_name)));
  const uniqueClassNames = [...new Set(classcode)];
  const generations = Array.from(new Set(assistant
    .filter(a => a.initial !== null && a.initial !== undefined) 
    .map(a => {
      const match = a.initial?.match(/(\d+-\d+)/); 
      return match ? match[0] : '';
    })
    .filter(generation => generation !== '')));

  const fetchSubjects = async () => {
    try {
      const response = await invoke<Subjects[]>('getallsubject');
      setSubjects(response || []);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchClass = async() => {
    try {
      const response = await invoke<string[]>('get_class_by_subject_name',{"subjectcode":selectedSubject});
      setClasscode(response||[]);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await invoke<Rooms[]>('get_all_rooms');
      setRooms(response || []);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  const fetchTransaction = async () => {
    try {
      const response = await invoke<TransactionHeader[]>('get_all_transaction');
      settransactionHeader(response || []);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };
  const fetchAssistant = async () => {
    try {
      const response = await invoke<User[]>('get_all_assistant');
      setAssistant(response || []);
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };
  useEffect(() => {
    if (tabIndex === 1) {
      fetchTransaction();
      fetchAssistant();
    }
  }, [tabIndex]);
  useEffect(() => {
    fetchSubjects();
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    if(selectedClass){
      fetchRooms();    
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedSubject) {
      fetchClass();
    }
  }, [selectedSubject]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedTime(event.target.value);
  };

  function handleSubmitStudent(canInsert:string){
    invoke('allocatestudent', {
      "subjectcode": selectedSubject,
      "classcode" : selectedClass,
      "dateschedule" : selectedDate?.toISOString().split('T')[0],
      "timeschedule" : selectedTime,
      "rooms" : selectedRoom,
      "caninsert" : canInsert
      
    }).then((response:any) => {
      if (response[0] === "All Field must be Filled !") {
        seterrorMessage(response)
        setisSuccess(false)
      } 
      else if(response[0]==="Date must be in the future!"){
        seterrorMessage(response)
        setisSuccess(false)
      }
      else if(response[0]==="Time must be in the future!"){
        seterrorMessage(response)
        setisSuccess(false)
      }
      else if(response[0]==="Invalid time format or out of working hours!"){
        seterrorMessage(response)
        setisSuccess(false)
      }
      else {
        seterrorMessage(response[0]) // Clear error message if no error
        setisSuccess(true) // Set success to true if successful
        setfailedAssigned(response)
        setOpenPopup(true)
      }
    }).catch((error) => {
      console.error('Error allocating student:', error);
      seterrorMessage("An error occurred while allocating student."); // Set generic error message
      setisSuccess(false);
    });
  }

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (transactionId: string) => {
    return selectedTransaction.indexOf(transactionId) !== -1;
  };
  
  const handleSelectRow = (event: React.ChangeEvent<HTMLInputElement>, transactionId: string) => {
    const selected = isSelected(transactionId);
    setSelectedTransaction((prevSelected) =>
      selected
        ? prevSelected.filter((id) => id !== transactionId)
        : [...prevSelected, transactionId]
    );
  };

  function handleAssitant(canInsert:string){
    invoke('allocateassistant',{"transactionid":selectedTransaction,"assistant":assistant,"selectedassistant":selectedAssistant,"selectedgeneration":selectedGeneration,"caninsert":canInsert}).then((response:any)=>{
      if(response[0]==="Please Choose at least 1 transaction !"){
        seterrorMessage2(response[0])
        setisSuccess(false)
      }
      else if(response[0]==="Please Choose either by selecting assistant or generation !"){
        seterrorMessage2(response[0])
        setisSuccess(false)
      }else{
        seterrorMessage2(response[0]) // Clear error message if no error
        setisSuccess(true) // Set success to true if successful
        setfailedAssigned2(response)
        setOpenPopup(true)
        if(canInsert=="Yes"){

          setShowSubmitButton(false);
        }
      }
    })
  }

  return (
    <Layout content={
      <Box minHeight="100vh">
        <Tabs value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)}>
          <Tab label="Allocate Student" />
          <Tab label="Allocate Assistant" />
        </Tabs>
        {tabIndex === 0 && (
          <Box sx={{pt:4}}>
            <Typography variant="h2" color="text.primary">Allocate Student Exam </Typography>
            <FormControl  sx={{minWidth:"40vw", mt:3}}>
              <InputLabel>Subject</InputLabel>  
              <Select
                value={selectedSubject}
                onChange={(e) => setselectedSubject(e.target.value as string)}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 225,
                      width: '25ch', 
                    },
                  },
                }}
              >
                {subjects.map(subject => (
                  <MenuItem key={subject.subject_code} value={subject.subject_code}>
                    {`${subject.subject_code} - ${subject.subject_name}`}
                  </MenuItem>
                ))}
              </Select>

            </FormControl>
            <br />
            <FormControl sx={{ minWidth: "20vw", mt: 3 }}>
              <InputLabel>Class</InputLabel>
              <Select
                multiple
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value as string[])}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 225,
                      width: '25ch',
                    },
                  },
                }}
              >
                {uniqueClassNames.map(classCode => (
                  <MenuItem key={classCode} value={classCode}>{classCode}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <br />
            <FormControl sx={{ minWidth: "20vw", mt: 3 }}>
              <TextField
                id="date"
                label="Date"
                type="date"
                value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                onChange={(e) => handleDateChange(new Date(e.target.value))}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </FormControl>
            <br />
            <FormControl sx={{ minWidth: "20vw", mt: 3 }}>
              <TextField
                id="time"
                label="Time"
                type="time"
                value={selectedTime}
                onChange={handleTimeChange}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  step: 300, // 5 min
                }}
              />
            </FormControl>

            <br />
            
          <FormControl sx={{ minWidth: "20vw", mt: 3 }}>
            <InputLabel>Room</InputLabel>
            <Select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value as string)}
              MenuProps={{
                PaperProps: {
                  style: {
                    maxHeight: 225,
                    width: '25ch',
                  },
                },
              }}
            >
               {rooms.map(room => (
                  <MenuItem key={room.room_number as string} value={room.room_number as string}>{room.room_number}</MenuItem>
                ))}

            </Select>
          </FormControl>
          <br />
          <Typography 
              variant="body1" 
              color={isSuccess ? "green" : "red"}
            
              >
                {errorMessage}
            </Typography>
            <br />
          <Button variant="contained" color="primary" sx={{mt: { xs: 4, sm: 2 }, padding: '16px 44px' }} onClick={(e) => { 
              e.preventDefault(); 
              handleSubmitStudent("No"); 
          }}>
              Submit
          </Button>
          <Dialog open={openPopup} onClose={() => setOpenPopup(false)}>
              <DialogTitle>Transaction Detail</DialogTitle>
              <DialogContent>
                <List>
                  {failedAssigned.map((assignment, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={assignment} />
                    </ListItem>
                  ))}
                </List>
              </DialogContent>
              <DialogActions>
              {showSubmitButton && (
                <Button onClick={(e) => { 
                    e.preventDefault(); 
                    handleSubmitStudent("Yes"); 
                    setShowSubmitButton(false)
                }} color="primary" autoFocus>
                  Submit
                </Button>
              )}
                <Button onClick={() => {setOpenPopup(false);setShowSubmitButton(true)}} color="primary" autoFocus>
                  Close
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}
        {tabIndex === 1 && (
          <Box sx={{ pt: 4 }}>
            <Typography variant="h2" color="text.primary">
              Allocate Assistant Proctoring
            </Typography>
            <TableContainer component={Paper}>
            <Table sx={{ mt: 3 }}>
              <TableHead>
                <TableRow>
                <TableCell></TableCell>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Subject Code</TableCell>
                <TableCell>Shift Number</TableCell>
                <TableCell>Transaction Date</TableCell>
                <TableCell>Room Number</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactionHeader.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((transaction, index) => (
                  <TableRow key={index}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={isSelected(transaction.transactionid)}
                        onChange={(e) => handleSelectRow(e, transaction.transactionid)}
                      />
                    </TableCell>
                    <TableCell>{transaction.transactionid}</TableCell>
                    <TableCell>{transaction.subject_code}</TableCell>
                    <TableCell>{transaction.shift_number}</TableCell>
                    <TableCell>{transaction.transactiondate}</TableCell>
                    <TableCell>{transaction.room_number}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 100]}
            component="div"
            count={transactionHeader.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
           <FormControl  sx={{minWidth:"20vw",maxWidth:"20vw"}}>
              <InputLabel>Choose Assistant</InputLabel>  
              <Select
                multiple
                value={selectedAssistant}
                onChange={(e) => setSelectedAssistant(e.target.value as string[])}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 225,
                      width: '25ch', 
                    },
                  },
                }}
              >
                {assistant.map(assistant => (
                  <MenuItem key={assistant.initial as string } value={assistant.initial as string}>
                    {`${assistant.initial } - ${assistant.username}`}
                  </MenuItem>
                ))}
              </Select>

            </FormControl>

            <FormControl  sx={{minWidth:"20vw",maxWidth:"20vw",ml:3}}>
              <InputLabel>Choose Assistant by Generation</InputLabel>  
              <Select
                multiple
                value={selectedGeneration}
                onChange={(e) => setSelectedGeneration(e.target.value as string[])}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 225,
                      width: '25ch', 
                    },
                  },
                }}
              >
                {generations.map(generation => (
                  <MenuItem key={generation} value={generation}>
                    {generation}
                  </MenuItem>
                ))}
              </Select>

            </FormControl>
            
            <Typography 
              variant="body1" 
              color={isSuccess ? "green" : "red"}
            
              >
                {errorMessage2}
            </Typography>
            <br />
            <Button variant="contained" color="primary" sx={{mt:3,width:"12vw"}} onClick={(e) => { 
                      e.preventDefault(); 
                      handleAssitant("No"); 
              }}> 
              Submit
            </Button>
            <Dialog open={openPopup} onClose={() => setOpenPopup(false)}>
              <DialogTitle>Transaction Detail</DialogTitle>
              <DialogContent>
                <List>
                  {failedAssigned2.map((assignment, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={assignment} />
                    </ListItem>
                  ))}
                </List>
              </DialogContent>
              <DialogActions>
              {showSubmitButton && (
                <Button 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    handleAssitant("Yes"); 
                    setShowSubmitButton(false); // Set state to hide the "Submit" button
                  }} 
                  color="primary" 
                  autoFocus
                 
                >
                  Submit
                </Button>
               )}
                <Button onClick={() => {setOpenPopup(false);setShowSubmitButton(true);}} color="primary" autoFocus>
                  Close
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}
      </Box>
    } />
  );
};

export default ExamScheduler;
