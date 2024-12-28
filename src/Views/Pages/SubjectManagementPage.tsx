import React, { useEffect, useState } from 'react';
import Layout from '../Layout';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TablePagination from '@mui/material/TablePagination';
import { invoke } from '@tauri-apps/api/tauri';
import Subjects from '../../model/subject';
import { Box, TextField } from '@mui/material';

const SubjectManagementPage = () => {
  const [subjects, setSubjects] = useState<Subjects[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState('');
  const [filteredSubjects, setFilteredSubjects] = useState<Subjects[]>([]);

  const fetchSubjects = async () => {
    try {
      const response = await invoke<Subjects[]>('getallsubject');
      setSubjects(response || []);
      setFilteredSubjects(response || []); // Initialize filteredSubjects with all subjects
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    }
  };

  useEffect(() => {
    fetchSubjects();
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    // Filter subjects based on search query
    const filtered = subjects.filter(subject =>
      subject.subject_code.toLowerCase().includes(search.toLowerCase()) ||
      subject.subject_name.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredSubjects(filtered);
  }, [search, subjects]); // Trigger filter when search query or subjects change

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows = rowsPerPage - Math.min(rowsPerPage, filteredSubjects.length - page * rowsPerPage);

  return (
    <Layout content={
      <Box height="100%" >
        <Typography variant="h1" color="text.primary" textAlign="left">Subject Management</Typography>
        <TextField
          id="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mt: { sm: 5 } }}
          placeholder='Search'
        />
        <TableContainer component={Paper} sx={{ mt: { sm: 3 } }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="h3" color="text.primary">Subject Code</Typography></TableCell>
                <TableCell><Typography variant="h3" color="text.primary">Subject Name</Typography></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubjects.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((subject, index) => (
                <TableRow key={index}>
                  <TableCell>{subject.subject_code}</TableCell>
                  <TableCell>{subject.subject_name}</TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={2} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={filteredSubjects.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>
    } />
  );
};

export default SubjectManagementPage;
