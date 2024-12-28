import React, { ChangeEvent, useEffect, useState } from 'react';
import { Link, useLocation,useParams } from 'react-router-dom';
import Layout from './Layout';
import { Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Paper, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Tabs, TextField, TextareaAutosize, Typography } from '@mui/material';
import { invoke } from '@tauri-apps/api/tauri';
import TransactionHeader from '../model/transctionheader';

const TransactionDetail = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const { id } = useParams();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const previousPage = queryParams.get('from');
  const [isStaff, setisStaff] = useState(false)
  const [transaction, settransaction] = useState<TransactionHeader[]>([])
  const [transactionDetail, setTransactionDetail] = useState<string[][]>([]);
  const [selectedTransactionDetail, setselectedTransactionDetail] = useState<String[]>([])
  const [isOngoing, setisOngoing] = useState(false)
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedGridItem, setSelectedGridItem] = useState<String[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSeat, setNewSeat] = useState('');
  const [reason, setReason] = useState('');
  const [reasonExtendClass, setReasonExtendClass] = useState('');
  const [reasonExtendStudent, setReasonExtendStudent] = useState('');
  const [selectedStudentInfo, setSelectedStudentInfo] = useState({ nim: '', name: '',seatnum:"" });
  const [errorMessage, seterrorMessage] = useState("")
  const [errorMessage2, seterrorMessage2] = useState("")
  const [errorMessage3, seterrorMessage3] = useState("")
  const [errorMessage4, seterrorMessage4] = useState("")
  const [isSuccess, setisSuccess] = useState(Boolean)
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [timeExtensionClass, settimeExtensionClass] = useState("")
  const [timeExtensionStudent, settimeExtensionStudent] = useState("")
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isPopupOpen2, setIsPopupOpen2] = useState(false);
  const [cheatReason, setcheatReason] = useState("")
  const [photos, setPhotos] = useState<File[]>([]);
  const [transactionNotes, settransactionNotes] = useState("")
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

  const handleGridItemClick = (detail: String[]) => {
    setSelectedGridItem(detail);
    setSelectedStudentInfo({ nim: detail[1].toString(), name: detail[2].toString(),seatnum: detail[0].toString() });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedGridItem([]);
    setSelectedStudentInfo({ nim: '', name: '',seatnum:"" });
    setNewSeat('');
    setReason('');
    seterrorMessage('')
  };

  const handleNewSeatChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNewSeat(event.target.value);
  };

  const handleReasonChange = (event: ChangeEvent<HTMLInputElement>) => {
    setReason(event.target.value);
  };

  const handleDialogSubmit = () => {
    invoke('change_seat',{"transactionid":id?.toString(),"nim":selectedStudentInfo.nim.toString(),"name":selectedStudentInfo.name.toString(),"oldseat":selectedStudentInfo.seatnum.toString(),"newseat":newSeat.toString(), "reason":reason}).then((response:any)=>{
      if(response==="All Field Must be Filled !"){
        seterrorMessage(response)
        setisSuccess(false)
      }else if(response==="Cannot change to the same seat !"){
        seterrorMessage(response)
        setisSuccess(false)
      }else if(response==="Seat is already taken!"){
        seterrorMessage(response)
        setisSuccess(false)
      }
      else if(response==="Seat must be more than 0!"){
        seterrorMessage(response)
        setisSuccess(false)
      }
      else if(response==="New seat exceeds room capacity!"){
        seterrorMessage(response)
        setisSuccess(false)
      }
      else{
        seterrorMessage("Success")
        setisSuccess(true)
      }
    })
  };

  const handle_upload_examcase = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const reader = new FileReader();
  
        reader.onload = (event) => {
          if (event.target?.result instanceof ArrayBuffer) {
            const arrayBuffer = event.target.result; 
            const uint8Array = new Uint8Array(arrayBuffer);
            const vec = Array.from(uint8Array); // Convert Uint8Array to Vec<u8>
            invoke('upload_exam_case', { "form": vec,"transactionid":id?.toString()});
            setUploadedFile(file);
          }
        };
  
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('Error converting file to Vec<u8>:', error);
      }
    }
  }

  const handleDownloadExamCase = async () => {
    try {
      const response = await invoke<ArrayBuffer>('download_exam_case', {
        "transactionid": id?.toString(),
      });
  
      if (response) {
        const uint8Array = new Uint8Array(response);
        const arrayBuffer = uint8Array.buffer;
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${id}.zip`);
        document.body.appendChild(link);
        link.click();
      } else {
        console.error('No file found');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  function get_transaction_by_id(){
    invoke('get_transaction_by_id',{"transactionid":id?.toString()}).then((response:any)=>{
      settransaction(response)
      const isAnyOngoing = response.some((transaction: TransactionHeader) => transaction.status === 'Ongoing');
      setisOngoing(isAnyOngoing);
    })
  }

  function get_transaction_detail_by_id(){
    invoke('get_transaction_detail_by_id',{"transactionid":id?.toString()}).then((response:any) => {
        setTransactionDetail(response)
    })
  }

  function get_transaction_notes(){
    invoke('get_transaction_notes',{"transactionid":id?.toString()}).then((response:any) =>{
      settransactionNotes(response)
    })
  }

  useEffect(()=>{
    get_transaction_by_id()
    get_transaction_detail_by_id()
    get_transaction_notes()
    if(previousPage === "/homepagesubdev" || previousPage === "/homepageexamcoor" || previousPage === "/viewtransactionpage"){
      setisStaff(true)
    }
  },[])

  const handleFileUpload = async (nim: string) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.zip';
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const reader = new FileReader();
  
          reader.onload = (event) => {
            if (event.target?.result instanceof ArrayBuffer) {
              const arrayBuffer = event.target.result;
              const uint8Array = new Uint8Array(arrayBuffer);
              const vec = Array.from(uint8Array); // Convert Uint8Array to Vec<u8>
              invoke('upload_file', { "form": vec, "nim": nim, "transactionid": id?.toString() });
              setUploadedFile(file);
            }
          };
  
          reader.readAsArrayBuffer(file);
        } catch (error) {
          console.error('Error converting file to Vec<u8>:', error);
        }
      }
    };
  
    // Trigger file input dialog
    fileInput.click();
  };
  
  const handleDownloadAnswer = async (nim:String) => {
    try {
      const response = await invoke<ArrayBuffer>('download_exam_case', {
        nim: nim.toString(),
        transactionid: id?.toString(),
      });
  
      if (response) {
        const uint8Array = new Uint8Array(response);
        const arrayBuffer = uint8Array.buffer;
        const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${nim}_${id?.toString()}.zip`);
        document.body.appendChild(link);
        link.click();
      } else {
        console.error('No file found');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  function handleTimeExtensionClass(){
    invoke("extend_time_class",{"transactionid":id?.toString(),"minutes":timeExtensionClass,"reason":reasonExtendClass}).then((response:any)=>{
      if(response === "All field must be filled !"){
        seterrorMessage2(response)
        setisSuccess(false)
      }
      else if(response==="Minutes must be greater than 0!"){
        seterrorMessage2(response)
        setisSuccess(false)
      }else{
        seterrorMessage2("Success")
        setisSuccess(true)
      }
    })

  }

  function handleTimeExtensionStudent(){
    invoke("extend_time_student",{"transactionid":id?.toString(),"minutes":timeExtensionStudent,"reason":reasonExtendStudent,"nim":selectedStudentInfo.nim.toString(),"name":selectedStudentInfo.name.toString(),"oldseat":selectedStudentInfo.seatnum.toString()}).then((response:any)=>{
      if(response === "All field must be filled !"){
        seterrorMessage3(response)
        setisSuccess(false)
      }
      else if(response==="Minutes must be greater than 0!"){
        seterrorMessage3(response)
        setisSuccess(false)
      }else{
        seterrorMessage3("Success")
        setisSuccess(true)
      }
    })
  }

  const handleMarkCheating = async () => {
    try {
      const photoDataArray = await Promise.all(photos.map(async (photo) => {
        const arrayBuffer = await photo.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        return Array.from(uint8Array);
      }));
  
      invoke("mark_cheat", {
        "detail": selectedTransactionDetail,
        "markreason": cheatReason,
        "photos": photoDataArray,
        "transactions":transaction
      }).then((response:any)=>{
        if(response==="All Field Must be Filled !"){
          seterrorMessage(response)
          setisSuccess(false)
        }else{
          seterrorMessage("Success")
          setisSuccess(true)
        }
      });
  
       
    } catch (error) {
      console.error("Error marking cheating:", error);
    }
  };
  
  const handleOpenPopupCheat = (detail:String[]) => {
    setselectedTransactionDetail(detail)
    setIsPopupOpen(true);
  };
  const handleClosePopupCheat = () => {
    setcheatReason("")
    seterrorMessage("")
    setPhotos([])
    setIsPopupOpen(false);
  };

  const handleOpenPopupTimeExtension = (detail:String[]) => {
    setSelectedStudentInfo({ nim: detail[1].toString(), name: detail[2].toString(),seatnum: detail[0].toString() });
    seterrorMessage3("")
    setIsPopupOpen2(true);
  };
  const handleClosePopupTimeExtension = () => {
    setSelectedStudentInfo({ nim: "", name:"",seatnum: "" });
    seterrorMessage3("")
    setIsPopupOpen2(false);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList) {
      const newPhotos = Array.from(fileList);
      setPhotos([...photos, ...newPhotos]);
    }
  };

  function handleVerify(){
    invoke('verify_transaction',{"transactionid":id?.toString(),"transactionnote":transactionNotes}).then((response)=>{
      if(response==="Must Fill transaction note to Verify!"){
        seterrorMessage4(response)
        setisSuccess(false)
      }else{
        seterrorMessage4("Success")
        setisSuccess(true)
      }
    })
  }

  return (
    <Layout content={
      <Box minHeight="100vh">
        <Button variant='contained' component={Link} to={previousPage || '/'} sx={{mb:3}}>Previous Page</Button>
        <Box>
        <TableContainer component={Paper}>
            <Table sx={{ mt: 2 }}>
            <TableHead>
                <TableRow>
                <TableCell>Transaction Id</TableCell>
                <TableCell>Subject Code</TableCell>
                <TableCell>Subject Name</TableCell>
                <TableCell>Room Number</TableCell>
                <TableCell>Transaction Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Proctor</TableCell>
                <TableCell>Status</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {transaction.map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell>{transaction.transactionid}</TableCell> 
                  <TableCell>{transaction.subject_code}</TableCell> 
                  <TableCell>{transaction.subject_name}</TableCell> 
                  <TableCell>{transaction.room_number}</TableCell> 
                  <TableCell>{transaction.transactiondate}</TableCell> 
                  <TableCell>{getShiftTime(transaction.shift_number.toString())}</TableCell>
                  <TableCell>{transaction.proctor}</TableCell> 
                  <TableCell>{transaction.status}</TableCell> 
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </TableContainer>
          {isOngoing && (
            <Box>
              <Button variant='contained' onClick={handleDownloadExamCase} sx={{mt:2,mb:3}}>Download case</Button>
            </Box>
          )}
          <Tabs sx={{mt:3}} value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)}>
                <Tab label="View Seat Mapping" />
                <Tab label="View Student Detail" />
          </Tabs>
          {tabIndex === 0 && (
            <Box>
              <Grid container spacing={2} sx={{ mt: 2 }} >
                {transactionDetail.map((detail, index) => (
                  <Grid item xs={12} md={1.5} key={index} onClick={() => handleGridItemClick(detail)}>
                    <Paper sx={{ bgcolor: "#36454F", textAlign: "center", minHeight: "30vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <Typography variant="body1" color="text.primary" sx={{mt:1,mb:1}}>Seat Number: {detail[0]}</Typography>
                      <Avatar alt="" src="" sx={{ width: 100, height: 100, marginBottom: 1 }} />
                      <Typography variant="body1" color="text.primary">{detail[1]}</Typography>
                      <div style={{ flex: "1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <Typography variant="body1" color="text.primary">{detail[2]}</Typography>
                      </div>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              {isOngoing && (
                <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                  <DialogTitle>Change Seat <br /> {selectedStudentInfo.nim} - {selectedStudentInfo.name}</DialogTitle>
                  <DialogContent >
                    <TextField
                      autoFocus
                      margin="dense"  
                      placeholder="New Seat"
                      type="text"
                      fullWidth
                      value={newSeat}
                      onChange={handleNewSeatChange}
                    />
                    <TextField
                      margin="dense"
                      placeholder="Reason"
                      type="text"
                      fullWidth
                      value={reason}
                      onChange={handleReasonChange}
                    />
                    <Typography 
                    variant="body1" 
                    color={isSuccess ? "green" : "red"}
                    sx={{pl: { xs: 4, sm: 1 } }}
                    >
                      {errorMessage}
                    </Typography>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">Cancel</Button>
                    <Button onClick={handleDialogSubmit} color="primary">Submit</Button>
                  </DialogActions>
                </Dialog>
              )}
            </Box>
          )}  
          {tabIndex === 1 && (
            <Box>
              <TableContainer component={Paper}>
                <Table sx={{ mt: 2 }}>
                <TableHead>
                    <TableRow>
                    <TableCell>No</TableCell>
                    <TableCell>NIM</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Seat</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Time Extension</TableCell>
                    <TableCell>Offense</TableCell>
                    <TableCell>Manual Upload</TableCell>
                    <TableCell>Download Answer</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                  {transactionDetail.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell> 
                      <TableCell>{transaction[1]}</TableCell> 
                      <TableCell>{transaction[2]}</TableCell> 
                      <TableCell>{transaction[0]}</TableCell> 
                      <TableCell>{transaction[3]}</TableCell> 
                      <TableCell>
                      {isOngoing && (
                        <Button variant="contained" color="primary" onClick={() => handleOpenPopupTimeExtension(transaction)}>
                            Time Extension
                        </Button>
                        )}
                      </TableCell> 
                      <TableCell>
                        {isOngoing && (
                          <Button variant="contained" color="primary" onClick={() => handleOpenPopupCheat(transaction)}>
                              Mark Cheating
                          </Button>
                        )}
                      </TableCell>  
                      <TableCell>
                      {isOngoing && (
                        <label htmlFor={`file-upload-${index}`}>
                          <input 
                            id={`file-upload-${index}`}
                            type="file" 
                            accept=".zip" 
                            onChange={() => handleFileUpload(transaction[1].toString())} 
                            style={{ display: 'none' }} 
                            disabled={transaction[3] === 'Finalized'}
                          /> 
                          <Button variant="contained" color="primary" component="span" disabled={transaction[3] === 'Finalized'}>
                            Upload Answer
                          </Button>
                        </label>
                      )}
                     </TableCell>
                      <TableCell>
                        <Button variant="contained" color="primary" onClick={() => handleDownloadAnswer(transaction[1].toString())} disabled={transaction[4] === "NO"}>
                            Download Answer
                        </Button>
                      </TableCell> 
                      
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                  rowsPerPageOptions={[10, 25, 100]}
                  component="div"
                  count={transactionDetail.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Box>
          )}  

          {/* Buat MARKING CHEAT */}
          {isOngoing && (
            <Dialog open={isPopupOpen} onClose={handleClosePopupCheat}>
            <DialogTitle>Mark Student Cheating</DialogTitle>
            <DialogContent>
              <TextField
                id=""
                label=""
                value={cheatReason}
                onChange={(e) => setcheatReason(e.target.value)}
                placeholder='Marking Reason'
              />
            <Typography variant="body1" color="text.primary" sx={{pt:4}}>Only accept Image file !</Typography>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{marginTop:8}} multiple/>
            <Typography 
              variant="body1" 
              color={isSuccess ? "green" : "red"}
              sx={{pl: { xs: 4, sm: 1 } }}
              >
              {errorMessage}
            </Typography>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center' }}>

              <Button onClick={(e) => { 
                      e.preventDefault(); 
                      handleMarkCheating()
                    }}  color="primary" variant='contained' sx={{ mr: 2, width: '150px', fontSize: '1.2rem' }}>Submit</Button>
              <Button onClick={handleClosePopupCheat} color="primary" variant='contained' sx={{ mr: 2, width: '150px', fontSize: '1.2rem' }}>Close</Button>
            </DialogActions>
          </Dialog>
        )}

          {isOngoing && (
            <Dialog open={isPopupOpen2} onClose={handleClosePopupTimeExtension}>
            <DialogTitle>Time Extension for Student</DialogTitle>
            <DialogContent>
            <TextField
                id="minutes"
                label="Minutes"
                type="number"
                value={timeExtensionStudent} 
                onChange={(e) => settimeExtensionStudent(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: 1,
                  max: 20,
                }}
                sx={{ mt: 2, mr: 2 }}
              />
              <br />
              <TextField
                id="reason"
                label="Reason"
                value={reasonExtendStudent}
                onChange={(e) => setReasonExtendStudent(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ mt: 2 }}
              />
              <Typography 
                variant="body1" 
                color={isSuccess ? "green" : "red"}
                sx={{pl: { xs: 4, sm: 1 } }}
                >
                {errorMessage3}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center' }}>

              <Button onClick={(e) => { 
                      e.preventDefault(); 
                      handleTimeExtensionStudent()
                    }}  color="primary" variant='contained' sx={{ mr: 2, width: '150px', fontSize: '1.2rem' }}>Submit</Button>
              <Button onClick={handleClosePopupTimeExtension} color="primary" variant='contained' sx={{ mr: 2, width: '150px', fontSize: '1.2rem' }}>Close</Button>
            </DialogActions>
          </Dialog>
        )}

        
        {isOngoing && (
          <Box>
            <Box sx={{mt:4}}>
              <Typography variant="h3" color="text.primary">Time Extension for Class</Typography>
              <TextField
                id="minutes"
                label="Minutes"
                type="number"
                value={timeExtensionClass} 
                onChange={(e) => settimeExtensionClass(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: 1,
                  max: 20,
                }}
                sx={{ mt: 2, mr: 2 }}
              />
              <br />
              <TextField
                id="reason"
                label="Reason"
                value={reasonExtendClass}
                onChange={(e) => setReasonExtendClass(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
                sx={{ mt: 2 }}
              />
              <br />
              <Typography 
                variant="body1" 
                color={isSuccess ? "green" : "red"}
                sx={{pl: { xs: 4, sm: 1 } }}
              >
                {errorMessage2}
              </Typography>
              <Button variant="contained" onClick={handleTimeExtensionClass} sx={{ mt: 2 }}>
                Add Time Extension
              </Button>
            </Box>

            <Box sx={{mt:4}}>
              <Typography variant="h3" color="text.primary">Transaction Notes</Typography>
              <TextareaAutosize
                id="minutes"
                placeholder="Add notes"
                value={transactionNotes} 
                onChange={(e) => settransactionNotes(e.target.value)}
                style={{ marginTop: 2, marginRight: 2, width: '50%', minHeight: '100px', resize: 'vertical', backgroundColor: 'black', padding:10 }}
              />

              <br />
              <Typography 
                variant="body1" 
                color={isSuccess ? "green" : "red"}
                sx={{pl: { xs: 4, sm: 1 } }}
                >
                {errorMessage4}
              </Typography>
              <br />
              <Button variant="contained" onClick={handleVerify} sx={{ mt: 2 }}>
                Verify Transaction
              </Button>
            </Box>
          </Box>
        )}

        

        </Box>
        {isStaff &&(
          <Box sx={{mt:5}}>
            <Typography variant="h3" color="text.primary" sx={{pb:3}}>Upload & Download Exam case (Staff only)</Typography>
            <input type="file" accept=".zip" onChange={handle_upload_examcase} />
            <Button variant='contained' onClick={handleDownloadExamCase}>Download case</Button>
          </Box>
        )}
      </Box>
    } />
  );
};

export default TransactionDetail;
