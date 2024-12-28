import React, { ChangeEvent, useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri';
import User from '../../model/User';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Link, PaletteMode, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography, createTheme } from '@mui/material';
import getLPTheme from '../../components/getLPTheme';
import Layout from '../Layout';

const HomePageStudent = () => {

  const [currentUser, setCurrentUser] = useState<User|null>(null);
  const [isOngoingExam, setisOngoingExam] = useState(false)
  const [transaction, settransaction] = useState<String[][]>([])
  const [selectedtransaction, setselectedtransaction] = useState<String[]>([])
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isFinalized, setisFinalized] = useState(false)
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const start_end_times: [string, string, string][] = [
      ["07:00", "09:20", "1"],
      ["09:20", "11:00", "2"],
      ["11:00", "13:20", "3"],
      ["13:20", "15:00", "4"],
      ["15:00", "17:20", "5"],
      ["17:20", "19:00", "6"],
  ];
  const getShiftTime = (shiftNumber: string) => {
    const shift = start_end_times.find(([_, __, number]) => number === shiftNumber);
    return shift ? `${shift[0]} - ${shift[1]}` : '';
  };


  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader();
  
        reader.onload = (event) => {
          if (event.target?.result instanceof ArrayBuffer) {
            const arrayBuffer = event.target.result;
            const uint8Array = new Uint8Array(arrayBuffer);
            const vec = Array.from(uint8Array); // Convert Uint8Array to Vec<u8>
            invoke('upload_file', { "form": vec,"nim":currentUser?.nim.toString(),"transactionid":selectedtransaction[7].toString()});
            setUploadedFile(file);
          }
        };
  
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('Error converting file to Vec<u8>:', error);
      }
    }
  };
  
  

  const handleDownloadAnswer = async () => {
    try {
      const response = await invoke<ArrayBuffer>('download_exam_case', {
        nim: currentUser?.nim.toString(),
        transactionid: selectedtransaction[7].toString(),
      });
  
      if (response) {
        const uint8Array = new Uint8Array(response);
        const arrayBuffer = uint8Array.buffer;
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${currentUser?.nim}_${selectedtransaction[0]}.zip`);
        document.body.appendChild(link);
        link.click();
      } else {
        console.error('No file found');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };
  
  
  

  function get_curr_user(){
    invoke<User>('get_current_user').then((response:User)=>{
      if (response){
        setCurrentUser(response)
        
      }
    })
  }

  function get_student_exam(nim:string){
    invoke("get_student_exam", { "nim": nim }).then((response: any) => {
      settransaction(response);
      response.forEach((transaction: string[]) => {
        if (transaction[6] === 'Ongoing') {
          if(transaction[8] === "Finalized"){
            setisFinalized(true)
          }
          setisOngoingExam(true)
          setselectedtransaction(transaction);
          return;
        }
      });
    }).catch(error => {
      console.error('Error fetching student exam data:', error);
    });
  }

  const handleDownloadExamCase = async () => {
    try {
      const response = await invoke<ArrayBuffer>('download_exam_case', {
        "transactionid": selectedtransaction[7].toString(),
      });
  
      if (response) {
        const uint8Array = new Uint8Array(response);
        const arrayBuffer = uint8Array.buffer;
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${selectedtransaction[7]}.zip`);
        document.body.appendChild(link);
        link.click();
      } else {
        console.error('No file found');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  useEffect(() => {
    get_curr_user();
  }, []);

  useEffect(() => {
    if (currentUser) {
      get_student_exam(currentUser.nim.toString()); // Provide a default value if nim is undefined
    }
  }, [currentUser])
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFinalizeAnswer = () => {
    invoke('finalize_exam',{"nim":currentUser?.nim.toString(),"transactionid":selectedtransaction[7].toString()}).then((response)=>{
      if (response){
        setisFinalized(true)
      }
    })
    setIsPopupOpen(false);
  };
  
  const handleOpenPopup = () => {
    // Close the popup
    setIsPopupOpen(true);
  };
  const handleClosePopup = () => {
    // Close the popup
    setIsPopupOpen(false);
  };

  const home = () => {
    return (
      <Box minHeight="100vh">
        {!isOngoingExam ? (
          <>
          <Typography variant="h1" color="text.primary">Exam Transaction</Typography>
          <TableContainer component={Paper}>
            <Table sx={{ mt: 3 }}>
            <TableHead>
                <TableRow>
                <TableCell>Subject Code</TableCell>
                <TableCell>Subject Name</TableCell>
                <TableCell>Room Number</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Seat Number</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {transaction.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell>{transaction[0]}</TableCell> {/* Transaction Date */}
                  <TableCell>{transaction[1]}</TableCell> {/* Room Number */}
                  <TableCell>{transaction[2]}</TableCell> {/* Subject Code */}
                  <TableCell>{transaction[3]}</TableCell> {/* Subject Name */}
                  <TableCell>{getShiftTime(transaction[4].toString())}</TableCell>
                  <TableCell>{transaction[5]}</TableCell> {/* Seat Number */}
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={transaction.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
          />
          </>
        ) : (
          <Box minHeight="100vh">
            <Paper>
            <Typography variant="h1" color="text.primary">Ongoing Exam</Typography>
            <TableContainer component={Paper}>
            <Table sx={{ mt: 3 }}>
            <TableHead>
                <TableRow>
                <TableCell>Subject Code</TableCell>
                <TableCell>Subject Name</TableCell>
                <TableCell>Room Number</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Seat Number</TableCell>
                <TableCell>Exam Status</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {transaction.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell>{selectedtransaction[0]}</TableCell>
                  <TableCell>{selectedtransaction[1]}</TableCell>
                  <TableCell>{selectedtransaction[2]}</TableCell> 
                  <TableCell>{selectedtransaction[3]}</TableCell> 
                  <TableCell>{getShiftTime(selectedtransaction[4].toString())}</TableCell>
                  <TableCell>{selectedtransaction[5]}</TableCell> 
                  <TableCell>{selectedtransaction[8]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </TableContainer>
            <Box mt={2}> 
              <Button variant="contained" color="primary" onClick={handleDownloadExamCase}>Download Exam Case</Button>
            </Box>
            <Box mt={2}>
              {!isFinalized && (
                <Box>
                  <Typography variant="h6" color="text.primary">Upload Answer</Typography>
                  <input type="file" accept=".zip" onChange={handleFileUpload} />
                </Box>
              )}
              {uploadedFile && (
                <Box mt={2}>
                  
                  <Button variant="contained" color="primary" onClick={handleDownloadAnswer}>Download Answer</Button>
                  <br />
                  {!isFinalized && (
                    <Button variant="contained" color="primary" sx={{mt:5}} onClick={handleOpenPopup}>Finalized Answer</Button>
                   )}
                </Box>
              )}
            </Box>
          </Paper>
          </Box>
          
        )}
        <Dialog open={isPopupOpen} onClose={handleClosePopup}>
          <DialogTitle>WARNING !!</DialogTitle>
          <DialogContent>
            {/* Add content for the popup here */}
            <Typography variant="h4" textAlign="center">Are you sure to Finalized Answer?</Typography>
            <Typography variant="h6" textAlign="center">Once you finalized you cannot upload an answer again!</Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center' }}>
            <Button onClick={(e) => { 
                    e.preventDefault(); 
                    handleFinalizeAnswer()
                  }}  color="primary" variant='contained' sx={{ mr: 2, width: '150px', fontSize: '1.2rem' }}>Finalize</Button>
            <Button onClick={handleClosePopup} color="primary" variant='contained' sx={{ mr: 2, width: '150px', fontSize: '1.2rem' }}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };
  

  return (
    <Layout content={home()} />
  );
}

export default HomePageStudent