interface TransactionHeader{
    transactionid:string,
    subject_code:string,
    shift_number:string,
    transactiondate:string,
    room_number:string,
    proctor:string|null,
    status:string,
    subject_name:string
}

export default TransactionHeader