const express = require('express');
const bodyparse = require('body-parser');
const cors = require('cors');
const db = require('./db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use('/uploads', express.static('uploads'));
const HOST = '192.168.1.115';
const PORT = 5000;


app.use(cors());
app.use(bodyparse.json());

// storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // cb(null, path.join(__dirname, 'uploads'));
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

// Get Users
app.get('/users', (req, res) => {
    const sql = 'SELECT * FROM users';
    db.query(sql, (err, results) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        const users = results.map((user) => ({
            ...user,
            imagePath: user.image_path ? `http://${HOST}:${PORT}/${user.image_path}` : null,
        }));
        res.json(users);
    });
});

// 2. Get a single user by ID
app.get('/users/:id', (req, res) => {
    const sql = 'SELECT * FROM users WHERE id = ?';
    db.query(sql, [req.params.id], (err, results) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.json(results[0]);
    });
});

// 3. Add a new user
app.post('/users', upload.single('image'), (req, res) => {
    const { name, email, age } = req.body;
    const imagePath = req.file ? req.file.path : null;

    const sql = 'INSERT INTO users (name, email, age,image_path) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, email, age, imagePath], (err, result) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.json({ id: result.insertId, name, email, age, imagePath });
    });
});

// 4. Update a user
app.put('/users/:id', upload.single('image'), (req, res) => {
    const { name, email, age } = req.body;
    const imagePath = req.file ? req.file.path : null;

    const sql = 'UPDATE users SET name = ?, email = ?, age = ?, image_path = ? WHERE id = ?';
    db.query(sql, [name, email, age, imagePath, req.params.id], (err) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        res.json({ message: 'User updated successfully.' });
    });
});


// 5. Delete a user
app.delete('/users/:id', (req, res) => {
    const sqlSelect = 'SELECT image_path FROM users WHERE id = ?';
    const sqlDelete = 'DELETE FROM users WHERE id = ?';

    db.query(sqlSelect, [req.params.id], (err, results) => {
        if (err) {
            res.status(500).send(err);
            return;
        }
        const imagePath = results[0]?.image_path;
        if (imagePath) {
            fs.unlink(imagePath, (err) => {
                if (err) console.error('Failed to delete file:', err);
            });
        }

        // Delete the user
        db.query(sqlDelete, [req.params.id], (err) => {
            if (err) {
                res.status(500).send(err);
                return;
            }
            res.json({ message: 'User deleted successfully.' });
        });
    });
});

app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
});