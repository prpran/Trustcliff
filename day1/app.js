const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const nodemailer = require('nodemailer');

const urlencodedParser = bodyParser.urlencoded({ extended: false });

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'day1'
});

pool.getConnection(function (err, con) {
  if (err) throw err;
  console.log('Connected!');

  const sql =
    'CREATE TABLE IF NOT EXISTS contact (name VARCHAR(255), email VARCHAR(255), phone int, website VARCHAR(255), comment VARCHAR(255))';

  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log('Table created');

    // Close the connection after creating the table
    con.release();
  });
});

app.use(express.static(__dirname));

app.get('/contact-us.html', function (req, res) {
  const filePath = path.join(__dirname, 'contact-us.html');
  res.sendFile(filePath);
});

app.post('/process_post', urlencodedParser, function (req, res) {
  try {
    const response = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      website: req.body.website,
      comment: req.body.comment
    };

    // Insert data into the 'contact' table
    pool.getConnection(function (err, con) {
      if (err) {
        console.error('Error getting MySQL connection:', err.message);
        res.status(500).send('Internal Server Error');
        return;
      }

      const sql =
        'INSERT INTO contact (name, email, phone, website, comment) VALUES (?, ?, ?, ?, ?)';
      const values = [
        response.name,
        response.email,
        response.phone,
        response.website,
        response.comment
      ];

      con.query(sql, values, function (err, result) {
        con.release();

        if (err) {
          console.error('Error inserting data into contact table:', err.message);
          res.status(500).send('Internal Server Error');
          return;
        }

        console.log('Data inserted into contact table:', result);

        // Send email with the data
        sendEmail(response);

        // Respond to the client
        res.json({ status: 'success', message: 'Data inserted successfully' });
      });
    });
  } catch (error) {
    console.error('Error processing form data:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

// Function to send an email using nodemailer
function sendEmail(data) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'pranav.sachu123@gmail.com',
      pass: 'jphi trhs tvjj daei' // Use your Gmail app password here
    }
  });

  const mailOptions = {
    from: 'pranav.sachu123@gmail.com',
    to: 'pranavxzxcr7@gmail.com',
    subject: 'Data from Contact Form',
    html: `
    <div style="background-color:#D4EFDF;color:#196F3D;">
      <h1>Contact Form Submission</h1>
      <p>Name: ${data.name}</p>
      <p>Email: ${data.email}</p>
      <p>Phone: ${data.phone}</p>
      <p>Website: ${data.website}</p>
      <p>Comment: ${data.comment}</p>
    </div>  
    `
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}

var server = app.listen(port, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('app listening http://%s:%s', host, port);
});