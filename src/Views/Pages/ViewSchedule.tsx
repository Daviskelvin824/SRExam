import React, { useEffect, useState } from 'react'
import Layout from '../Layout'
import { Box, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Tabs, TextField, Tooltip, Typography } from '@mui/material'
import { invoke } from '@tauri-apps/api/tauri';

const ViewSchedule = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [scheduleData, setScheduleData] = useState([]);
  const [studentSchedule, setstudentSchedule] = useState<String[][]>([])
  const [assistantSchedule, setassistantSchedule] = useState<String[][]>([])
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchNIM, setSearchNIM] = useState('');
  const [searchInitial, setSearchInitial] = useState('');
  function get_student_schedule() {
    invoke('get_student_schedule').then((response: any) => {
        const processedSchedule = response.map((row:any) => {
            return row.map((item:any, index:any) => {
                if (index === 3) {
                    return parseInt(item); 
                }
                return item;
            });
        });
        setstudentSchedule(processedSchedule);
    });
}
  function get_assistant_schedule() {
    invoke('get_assistant_schedule').then((response: any) => {
        const processedSchedule = response.map((row:any) => {
            return row.map((item:any, index:any) => {
                if (index === 3) {
                    return parseInt(item); 
                }
                return item;
            });
        });
        setassistantSchedule(processedSchedule);
    });
}

  useEffect(()=>{
    get_student_schedule()
    get_assistant_schedule()
  },[])

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const renderShiftCell = (hasTransaction: boolean, shiftNumber: number,student: String[]) => (
    <Tooltip title={hasTransaction ? (
        <>
            Transaction Detail: <br />
            NIM: {student[0]} <br />
            Class Code: {student[1]} <br />
            Transaction Date: {student[2]} <br />
            Room Number: {student[4]}
        </>
    ) : ''}>
    

      <Box
        component="div"
        bgcolor={hasTransaction ? 'red' : 'transparent'}
        width="50px"
        height="50px"
        sx={{ cursor: 'pointer' }}
      />
    </Tooltip>
  );
  const renderShiftCell2 = (hasTransaction: boolean, shiftNumber: number,assistant: String[]) => (
    <Tooltip title={hasTransaction ? (
        <>
            Transaction Detail: <br />
            Initial: {assistant[0]} <br />
            Subject Code: {assistant[1]} <br />
            Transaction Date: {assistant[2]} <br />
            Room Number: {assistant[4]}
        </>
    ) : ''}>
    

      <Box
        component="div"
        bgcolor={hasTransaction ? 'yellow' : 'transparent'}
        width="50px"
        height="50px"
        sx={{ cursor: 'pointer' }}
      />
    </Tooltip>
  );

  const filteredSchedule = studentSchedule.filter(student => {
    if (!searchNIM) return true;
    return student[0].toLowerCase().includes(searchNIM.toLowerCase());
  });
  
  const filteredSchedule2 = assistantSchedule.filter(assistant => {
    if (!searchInitial) return true;
    return assistant[0].toLowerCase().includes(searchInitial.toLowerCase());
  });
  
  

  return (
    <Layout content={
        <Box minHeight="100vh">
            <Tabs value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)}>
                <Tab label="Student Schedule" />
                <Tab label="Assistant Schedule" />
            </Tabs>
            <Box sx={{pt:5,pb:3}}>
                <Typography variant="h6" color="text.primary">Shift 1 : 07:00 - 09:20</Typography>
                <Typography variant="h6" color="text.primary">Shift 2 : 09:20 - 11:00</Typography>
                <Typography variant="h6" color="text.primary">Shift 3 : 11:00 - 13:20</Typography>
                <Typography variant="h6" color="text.primary">Shift 4 : 13:20 - 15:00</Typography>
                <Typography variant="h6" color="text.primary">Shift 5 : 15:00 - 17:20</Typography>
                <Typography variant="h6" color="text.primary">Shift 6 : 17:20 - 19:00</Typography>
            </Box>
            {tabIndex === 0 && (
                <Box> 
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                            component="div"
                            bgcolor={'red'}
                            width="50px"
                            height="50px"
                            sx={{ cursor: 'pointer' }}
                        />
                        <Typography variant="h6" color="text.primary" sx={{pl:3}}>: Exam</Typography>
                        
                    </Box>
                    <TextField
                        placeholder='Search By NIM'
                        variant="outlined"
                        value={searchNIM}
                        onChange={(e) => setSearchNIM(e.target.value)}
                        margin="normal"
                    />
                    <TableContainer>
                    <Table>
                    <TableHead>
                        <TableRow>
                        <TableCell>NIM</TableCell>
                        <TableCell>Shift 1</TableCell>
                        <TableCell>Shift 2</TableCell>
                        <TableCell>Shift 3</TableCell>
                        <TableCell>Shift 4</TableCell>
                        <TableCell>Shift 5</TableCell>
                        <TableCell>Shift 6</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredSchedule.map((student, index) => (
                            <TableRow key={index}>
                            <TableCell>{student[0]}</TableCell>
                            {[1, 2, 3, 4, 5, 6].map(shiftNumber => (
                                <TableCell key={shiftNumber}>
                                {renderShiftCell(parseInt(student[3].toString()) === shiftNumber , shiftNumber,student)}


                                </TableCell>
                            ))}
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                rowsPerPageOptions={[10, 25, 100]}
                component="div"
                count={studentSchedule.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                />
                </Box>
            )}  
            {tabIndex === 1 && (
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                            component="div"
                            bgcolor={'red'}
                            width="50px"
                            height="50px"
                            sx={{ cursor: 'pointer' }}
                        />
                        <Typography variant="h6" color="text.primary" sx={{pl:3}}>: Exam</Typography>
                        <Box
                            component="div"
                            bgcolor={'yellow'}
                            width="50px"
                            height="50px"
                            sx={{ cursor: 'pointer',ml:3 }}
                        />
                        <Typography variant="h6" color="text.primary" sx={{pl:3}}>: Proctor</Typography>
                    </Box>
                    <TextField
                        placeholder='Search By Initial'
                        variant="outlined"
                        value={searchInitial}
                        onChange={(e) => setSearchInitial(e.target.value)}
                        margin="normal"
                    />
                    <TableContainer>
                        <Table>
                        <TableHead>
                            <TableRow>
                            <TableCell>Initial</TableCell>
                            <TableCell>Shift 1</TableCell>
                            <TableCell>Shift 2</TableCell>
                            <TableCell>Shift 3</TableCell>
                            <TableCell>Shift 4</TableCell>
                            <TableCell>Shift 5</TableCell>
                            <TableCell>Shift 6</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredSchedule2.map((assistant, index) => (
                                <TableRow key={index}>
                                <TableCell>{assistant[0]}</TableCell>
                                {[1, 2, 3, 4, 5, 6].map(shiftNumber => (
                                    <TableCell key={shiftNumber}>
                                    {renderShiftCell2(parseInt(assistant[3].toString()) === shiftNumber , shiftNumber,assistant)}


                                    </TableCell>
                                ))}
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                    rowsPerPageOptions={[10, 25, 100]}
                    component="div"
                    count={assistantSchedule.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Box>
            )}  
        </Box>
    }/>
  )
}

export default ViewSchedule