import React, { useState } from 'react'
import Layout from '../Layout'
import { Box, FormControl, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material'
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { invoke } from '@tauri-apps/api/tauri';

const RoomManagement = () => {
  const initialDate = new Date(); // Set initial date to current date
  const [selectedDate, setselectedDate] = useState<Date | null>(initialDate);
  const [rooms, setrooms] = useState<String[][]>([])
  const [selectedRooms, setselectedRooms] = useState<string[]>([]) 
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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
  const handleDateChange = (date:any) => {
    setselectedDate(date);
    const dateString = date.toISOString().split('T')[0];
    invoke('get_room_by_date',{"date":dateString}).then((response:any)=>{
      setrooms(response)
    })
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  const filteredRooms = selectedRooms.length > 0 ? rooms.filter(room => selectedRooms.includes(room[0].toString())) : rooms;


  const renderShiftCell = (hasTransaction: boolean, shiftNumber: number,room: String[]) => (
    <Tooltip title={hasTransaction ? (
        <>
            Room Transaction : <br />
            Campus: {room[2]} <br />
            Transaction Id: {room[5]} <br />
            Transaction Date: {room[3]} <br />
            Time: {getShiftTime(room[4].toString())} <br />
        </>
    ) : ''}>
    

      <Box
        component="div"
        bgcolor={hasTransaction ? 'red' : 'white'}
        width="50px"
        height="50px"
        sx={{ cursor: 'pointer' }}
      />
    </Tooltip>
  );

  return (
    <Layout content={
        <Box minHeight="100vh">
           <Typography variant="h6" color="text.primary">Select a Date</Typography>
            <DatePicker
              selected={selectedDate}
              onChange={handleDateChange}
              dateFormat="yyyy-MM-dd"
              placeholderText="Select Date"
              className="w-full border border-gray-300 rounded-md p-2 mt-2"
            />
          <br />
          <Typography variant="h6" color="text.primary" sx={{mt:2}}>Select a Room</Typography>
            <FormControl  sx={{minWidth:"20vw", mt:2}}>
              <InputLabel>Pick a Room</InputLabel>  
              <Select
                multiple
                value={selectedRooms}
                onChange={(e) => setselectedRooms(e.target.value as string[])}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 225,
                      width: '25ch', 
                    },
                  },
                }}
              >
                {rooms.map((room) => (
                  <MenuItem key={room[0].toString()} value={room[0].toString()}> 
                    {room[0]} 
                  </MenuItem>
                ))}
              </Select>

            </FormControl>
            <Box sx={{ display: 'flex', alignItems: 'center' ,mt:3}}>
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
                    bgcolor={'white'}
                    width="50px"
                    height="50px"
                    sx={{ cursor: 'pointer' ,ml:3}}
                />
                <Typography variant="h6" color="text.primary" sx={{pl:3}}>: Available</Typography>
            </Box>
            <TableContainer component={Paper}>
              <Table sx={{ mt: 3 }}>
              <TableHead>
                  <TableRow>
                  <TableCell>Room Number</TableCell>
                  <TableCell>Room Capacity</TableCell>
                  <TableCell>Shift 1</TableCell>
                  <TableCell>Shift 2</TableCell>
                  <TableCell>Shift 3</TableCell>
                  <TableCell>Shift 4</TableCell>
                  <TableCell>Shift 5</TableCell>
                  <TableCell>Shift 6</TableCell>
                  </TableRow>
              </TableHead>
              <TableBody>
                {filteredRooms.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((room, index) => (
                  <TableRow key={index}>
                    <TableCell>{room[0]}</TableCell> 
                    <TableCell>{room[1]}</TableCell> 
                    {[1, 2, 3, 4, 5, 6].map(shiftNumber => (
                      <TableCell key={shiftNumber}>
                      {renderShiftCell(parseInt(room[4].toString()) === shiftNumber , shiftNumber,room)}
                      </TableCell>
                  ))}
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </TableContainer>

        </Box>
    }/>
  )
}

export default RoomManagement