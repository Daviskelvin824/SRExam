import React, { useEffect, useState } from 'react';
import Layout from '../Layout';
import { Box, Paper, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Tabs, Typography } from '@mui/material';
import TransactionHeader from '../../model/transctionheader';
import User from '../../model/User';
import { invoke } from '@tauri-apps/api/tauri';
import { Link } from 'react-router-dom';

const HomePageAssistant = () => {
  const [currentUser, setCurrentUser] = useState<User|null>(null);
  const [transaction, setTransaction] = useState<TransactionHeader[]>([]);
  const [ongoingTransaction, setOngoingTransaction] = useState<TransactionHeader[]>([]);
  const [isOngoingExam, setIsOngoingExam] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabIndex, setTabIndex] = useState(0);
  const previousPageUrl = window.location.pathname;
  const startEndTimes: [string, string, string][] = [
    ["07:00", "09:20", "1"],
    ["09:20", "11:00", "2"],
    ["11:00", "13:20", "3"],
    ["13:20", "15:00", "4"],
    ["15:00", "17:20", "5"],
    ["17:20", "19:00", "6"],
  ];

  const getShiftTime = (shiftNumber: string) => {
    const shift = startEndTimes.find(([_, __, number]) => number === shiftNumber);
    return shift ? `${shift[0]} - ${shift[1]}` : '';
  };

  const get_curr_user = async () => {
    try {
      const response = await invoke<User>('get_current_user');
      if (response) {
        setCurrentUser(response);
        await fetchTransaction();
      }
    } catch (error) {
      console.error('Failed to get current user:', error);
    }
  };

  const fetchTransaction = async () => {
    try {
        const response = await invoke<TransactionHeader[]>('get_all_transaction_by_initial',{"initial":currentUser?.initial});
        setTransaction(response || []);
        const ongoingTransactions2: TransactionHeader[] = [];
        response.forEach((transaction: TransactionHeader) => {
          if (transaction.status === 'Ongoing') {
            ongoingTransactions2.push(transaction);
            setIsOngoingExam(true)
          }
        });
        setOngoingTransaction(ongoingTransactions2);
    } catch (error) {
        console.error('Failed to fetch subjects:', error);
    }
  };

  useEffect(() => {
    get_curr_user();
  }, []);
  useEffect(() => {
    if(currentUser){

      fetchTransaction()
    }
  }, [currentUser]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const content = () => {
    return (
      <Box minHeight="100vh">
        <Tabs value={tabIndex} onChange={(_, newValue) => setTabIndex(newValue)}>
          <Tab label="Ongoing Proctoring" />
          <Tab label="All Proctoring" />
        </Tabs>
        {tabIndex === 0 && (
          <Box>
            {isOngoingExam ? (
              <>
              <Typography variant="h1" color="text.primary">Your Proctoring Transaction</Typography>
              <TableContainer component={Paper}>
                <Table sx={{ mt: 3 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject Code</TableCell>
                      <TableCell>Subject Name</TableCell>
                      <TableCell>Assigned Class</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ongoingTransaction.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((transaction, index) => (
                      <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#333333', cursor: 'pointer' } }} component={Link} to={`/transactiondetail/${transaction.transactionid}?from=${encodeURIComponent(previousPageUrl)}`}>
                        <TableCell>{transaction.subject_code}</TableCell>
                        <TableCell>{transaction.subject_name}</TableCell>
                        <TableCell>{transaction.room_number}</TableCell>
                        <TableCell>{transaction.transactiondate}</TableCell>
                        <TableCell>{getShiftTime(transaction.shift_number.toString())}</TableCell>
                        <TableCell>{transaction.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 100]}
                component="div"
                count={ongoingTransaction.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
              </>
            ) : (
              <Typography variant="h4" color="text.primary" textAlign="center" sx={{pt:4}}>-- You have no ongoing proctoring exam --</Typography>
            )}
            
          </Box>
        )}
        {tabIndex === 1 && (
          <Box>
            <Typography variant="h1" color="text.primary">All Proctoring Transaction</Typography>
            <TableContainer component={Paper}>
              <Table sx={{ mt: 3 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Subject Code</TableCell>
                    <TableCell>Subject Name</TableCell>
                    <TableCell>Assigned Class</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transaction.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((transaction, index) => (
                    <TableRow
                    key={index} component={Link} to={`/transactiondetail/${transaction.transactionid}?from=${encodeURIComponent(previousPageUrl)}`} sx={{ '&:hover': { backgroundColor: '#333333', cursor: 'pointer' } }} style={{ backgroundColor: transaction.status === 'Finished' ? 'green' : 'red' }} 
                    >
                      <TableCell>{transaction.subject_code}</TableCell>
                      <TableCell>{transaction.subject_name}</TableCell>
                      <TableCell>{transaction.room_number}</TableCell>
                      <TableCell>{transaction.transactiondate}</TableCell>
                      <TableCell>{getShiftTime(transaction.shift_number.toString())}</TableCell>
                      <TableCell>{transaction.status}</TableCell>
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
          </Box>
        )}
      </Box>
    )
  };

  return (
    <Layout content={content()} />
  )
}

export default HomePageAssistant;
