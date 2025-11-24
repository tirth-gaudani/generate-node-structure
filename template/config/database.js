import pg from 'pg';
const { Client } = pg;

let con = new Client({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASS,
    port: 5432,
});

con.connect().then(() => {
    console.log('\x1b[4mSuccess\x1b[0m');
}).catch((err) => {
    console.error('\x1B[31mError***', err, '***\x1b[0m');
});

export default con;