interface User{
    forEach(arg0: (transaction: string[]) => void): unknown;
    find(arg0: (transaction: string[]) => boolean): unknown;
    bn_number:String,
    username:String ,
    nim:String ,
    password:String,
    role:String ,
    major:String,
    initial:String|null,
}

export default User