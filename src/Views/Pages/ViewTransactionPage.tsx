import React, { useEffect, useState } from 'react'
import Layout from '../Layout'
import { invoke } from '@tauri-apps/api/tauri';
import TransactionHeader from '../../model/transctionheader';
import { Box, Checkbox, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField } from '@mui/material';
import { Link } from 'react-router-dom'; 
const ViewTransactionPage = () => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [transactionHeader, settransactionHeader] = useState<TransactionHeader[]>([])
    const previousPageUrl = window.location.pathname;
    const start_end_times: [string, string, string][] = [
        ["07:00", "09:20", "1"],
        ["09:20", "11:00", "2"],
        ["11:00", "13:20", "3"],
        ["13:20", "15:00", "4"],
        ["15:00", "17:20", "5"],
        ["17:20", "19:00", "6"],
    ];
    const [searchTerm, setSearchTerm] = useState('');

    const getShiftTime = (shiftNumber: string) => {
        const shift = start_end_times.find(([_, __, number]) => number === shiftNumber);
        return shift ? `${shift[0]} - ${shift[1]}` : '';
    };
    const fetchTransaction = async () => {
        try {
            const response = await invoke<TransactionHeader[]>('get_all_transaction');
            settransactionHeader(response || []);
        } catch (error) {
            console.error('Failed to fetch subjects:', error);
        }
    };
    useEffect(() => {
        fetchTransaction();
        window.scrollTo(0, 0);
    }, []);
    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
      };
    
      const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
      };
      const filteredTransactions = transactionHeader.filter(transaction => {
        const searchText = searchTerm.toLowerCase();
        return Object.values(transaction).some(value =>
            value && value.toString().toLowerCase().includes(searchText)
        );
    });
    
    return (
        <Layout
          content={
            <Box sx={{ pt: 0 }} minHeight="100vh">
                <TextField
                        id="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ mt: { sm: 5 } }}
                        placeholder='Search'
                    />
              <TableContainer component={Paper}>
                    <Table sx={{ mt: 3 }}>
                    <TableHead>
                        <TableRow>
                        <TableCell>Transaction Date</TableCell>
                        <TableCell>Room Number</TableCell>
                        <TableCell>Subject Code</TableCell>
                        <TableCell>Subject Name</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Proctoring Assistant</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((transaction, index) => (
                        <TableRow key={index} component={Link} to={`/transactiondetail/${transaction.transactionid}?from=${encodeURIComponent(previousPageUrl)}`} sx={{ '&:hover': { backgroundColor: '#333333', cursor: 'pointer' } }}>
                            <TableCell>{transaction.transactiondate}</TableCell>
                            <TableCell>{transaction.room_number}</TableCell>
                            <TableCell>{transaction.subject_code}</TableCell>
                            <TableCell>{transaction.subject_name}</TableCell>
                            <TableCell>{getShiftTime(transaction.shift_number)}</TableCell>
                            <TableCell>{transaction.proctor}</TableCell>
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
            </Box>
          }
        />
      );
      
}

export default ViewTransactionPage