import React, { useEffect, useState } from 'react'
import Layout from '../Layout'
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material'
import ReportHeader from '../../model/reportheader'
import { invoke } from '@tauri-apps/api/tauri'
import { Link } from 'react-router-dom'

const ReportManagement = () => {
  const [reportHeader, setreportHeader] = useState<ReportHeader[]>([])
  const [filterValue, setFilterValue] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const previousPageUrl = window.location.pathname;
  const start_end_times: [string, string, string][] = [
    ["07:00", "09:20", "1"],
    ["09:20", "11:00", "2"],
    ["11:00", "13:20", "3"],
    ["13:20", "15:00", "4"],
    ["15:00", "17:20", "5"],
    ["17:20", "19:00", "6"],
  ];

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getShiftTime = (shiftNumber: string) => {
    const shift = start_end_times.find(([_, __, number]) => number === shiftNumber);
    return shift ? `${shift[0]} - ${shift[1]}` : '';
  };
  function get_report_header(){
    invoke('get_report_header').then((response:any)=>{
      setreportHeader(response)
    })
  }

  useEffect(()=>{
    get_report_header()
  },[])

  const applyFilter = (report: ReportHeader) => {
    if (!filterValue) return true; // Show all if filter is empty
    const filterText = filterValue.toLowerCase();
    return (
      report.transactionid.toLowerCase().includes(filterText) ||
      report.subject_code.toLowerCase().includes(filterText) ||
      report.subject_name.toLowerCase().includes(filterText) ||
      getShiftTime(report.shift_number.toString()).toLowerCase().includes(filterText) ||
      report.transactiondate.toLowerCase().includes(filterText) ||
      report.room_number.toLowerCase().includes(filterText) ||
      report.proctor.toLowerCase().includes(filterText)
    );
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterValue(event.target.value);
  };

  return (
    <Layout content={
      <Box minHeight="100vh">
        <Typography variant="h1" color="text.primary">Incoming Report</Typography>
        <TextField
          placeholder="Search"
          variant="outlined"
          value={filterValue}
          onChange={handleFilterChange}
          sx={{ mt: 2 }}
        />
          <TableContainer component={Paper}>
            <Table sx={{ mt: 2 }}>
            <TableHead>
                <TableRow>
                <TableCell>Transaction Id</TableCell>
                <TableCell>Subject Code</TableCell>
                <TableCell>Subject Name</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Transaction Date</TableCell>
                <TableCell>Room Number</TableCell>
                <TableCell>Proctor</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
              {reportHeader.filter(applyFilter).map((report, index) => (
                <TableRow key={index} component={Link} to={`/reportdetailpage/${report.transactionid}?from=${encodeURIComponent(previousPageUrl)}`} sx={{ '&:hover': { backgroundColor: '#333333', cursor: 'pointer' } }}>
                  <TableCell>{report.transactionid}</TableCell> 
                  <TableCell>{report.subject_code}</TableCell> 
                  <TableCell>{report.subject_name}</TableCell> 
                  <TableCell>{getShiftTime(report.shift_number.toString())}</TableCell>
                  <TableCell>{report.transactiondate}</TableCell> 
                  <TableCell>{report.room_number}</TableCell> 
                  <TableCell>{report.proctor}</TableCell> 
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
              rowsPerPageOptions={[10, 25, 100]}
              component="div"
              count={reportHeader.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
          />
      </Box>
    }/>
  )
}

export default ReportManagement