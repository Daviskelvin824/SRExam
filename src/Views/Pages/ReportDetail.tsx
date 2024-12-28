import React, { useEffect, useState } from 'react'
import Layout from '../Layout'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { Link, useParams } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/tauri';
import ReportHeader from '../../model/reportheader';
import ReportDetails from '../../model/reportdetail';



const ReportDetail = () => {
    const queryParams = new URLSearchParams(location.search);
    const previousPage = queryParams.get('from');
    const { id } = useParams();
    const start_end_times: [string, string, string][] = [
        ["07:00", "09:20", "1"],
        ["09:20", "11:00", "2"],
        ["11:00", "13:20", "3"],
        ["13:20", "15:00", "4"],
        ["15:00", "17:20", "5"],
        ["17:20", "19:00", "6"],
      ];
    const [reportHeader, setreportHeader] = useState<ReportHeader[]>([])
    const [reportDetail, setreportDetail] = useState<ReportDetails[]>([])
    const [selectedEvidence, setSelectedEvidence] = useState<ArrayBuffer | undefined>();
    const [open, setOpen] = useState(false);

    const getShiftTime = (shiftNumber: string) => {
        const shift = start_end_times.find(([_, __, number]) => number === shiftNumber);
        return shift ? `${shift[0]} - ${shift[1]}` : '';
    };

    function get_report_header_by_id(){
        invoke("get_report_header_by_id",{"transactionid":id?.toString()}).then((response:any)=>{
            setreportHeader(response)
        })
    }
    
    function get_report_detail_by_id(){
        invoke("get_report_detail_by_id",{"transactionid":id?.toString()}).then((response:any)=>{
            setreportDetail(response)
        })
    }
    useEffect(()=>{
        get_report_header_by_id()
        get_report_detail_by_id()
    },[])

    const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    const handleEvidenceClick = (evidence: ArrayBuffer) => {
        setSelectedEvidence(evidence);
        setOpen(true);
    };

    return (
        <Layout content={
            <Box minHeight="100vh">
                <Button variant='contained' component={Link} to={previousPage || '/'} sx={{mb:3}}>Previous Page</Button>
                <TableContainer component={Paper}>
                    <Table sx={{ mt: 2 }}>
                    <TableHead>
                        <TableRow>
                        <TableCell>Subject Code</TableCell>
                        <TableCell>Subject Name</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Transaction Date</TableCell>
                        <TableCell>Room Number</TableCell>
                        <TableCell>Proctor</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                    {reportHeader.map((report, index) => (
                        <TableRow key={index} >
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
                <Typography variant="h2" color="text.primary" sx={{mt:5}}>Student Cheating List</Typography>
                <TableContainer component={Paper}>
                    <Table sx={{ mt: 2 }}>
                    <TableHead>
                        <TableRow>
                        <TableCell>NIM</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Seat Number</TableCell>
                        <TableCell>Notes</TableCell>
                        <TableCell>Evidence</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                    {reportDetail.map((report, index) => (
                        <TableRow key={index} >
                        <TableCell>{report.nim}</TableCell> 
                        <TableCell>{report.name}</TableCell> 
                        <TableCell>{report.seat_number}</TableCell> 
                        <TableCell>{report.markreason}</TableCell> 
                        <TableCell>
                            <img src={`data:image/png;base64,${arrayBufferToBase64(report.evidencephoto)}`} alt="Evidence" style={{ maxWidth: '200px', maxHeight: '100px' }} onClick={() => handleEvidenceClick(report.evidencephoto)}/>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                    </Table>
                </TableContainer>
                <Dialog open={open} onClose={() => setOpen(false)}>
                    <DialogTitle>Evidence Photo</DialogTitle>
                    <DialogContent>
                    {selectedEvidence && (
                        <img 
                            src={`data:image/png;base64,${arrayBufferToBase64(selectedEvidence)}`} 
                            alt="Evidence" 
                            style={{ width: '100%', height: 'auto' }}
                        />
                    )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpen(false)}>Close</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        }/>
    )
    }

    export default ReportDetail