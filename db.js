const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'crud-node'
});

db.connect((err) => {
    if (err) {
        console.error('Error Occured');
        return;
    }
    console.log('Connection Success');
});

module.exports = db;