import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {pool} from './db/db.js';  
import morgan from 'morgan';
import cors from 'cors';
import { Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = 5050;
const SECRET_KEY = process.env.JWT_SECRET; 
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Remplacez par l'URL de votre frontend
    methods: ["GET", "POST"]
  }
});

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());



/**
 * RECUPRER TOUT USER
 */
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "user"');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});


/**
 * CREER USER
 */
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;

    if (!username) return res.status(404).json({ messageError: "Veuillez ajouter une Email!" });
    if (!password) return res.status(404).json({ messageError: "Veuillez ajouter le mot de passe!" });

    // Vérifiez si un utilisateur existe
    const result = await pool.query('SELECT * FROM "user" WHERE username = $1', [username]);
    const userExists = result.rows.length > 0 ? result.rows[0] : null;
    if (userExists) return res.status(400).json({ messageError: "Cette email existe déjà!" });
    
     // Hashage du mot de passe
     const hashedPassword = await bcrypt.hash(password, 10);


    try {
        const result = await pool.query('INSERT INTO "user" (password, username, status) VALUES ($1, $2, $3) RETURNING *', [hashedPassword, username, false]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
    }
);


/**
 * LOGIN USER
 */
app.post('/signin', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username) return res.status(404).json({ messageError: "Veuillez ajouter une Email!" });
        if (!password) return res.status(404).json({ messageError: "Veuillez ajouter le mot de passe!" });
    
        // Vérifiez si un utilisateur existe
        const result = await pool.query('SELECT * FROM "user" WHERE username = $1', [username]);
        const userExists = result.rows.length > 0 ? result.rows[0] : null;
        if (!userExists) return res.status(400).json({ messageError: "Nom d'utilisateur incorrect!" });
        
        const passwordMatch = await bcrypt.compare(password, result.rows[0].password);
        if (!passwordMatch)  return res.status(400).json({ messageError: "Mot de passe incorrect" });
        
        await pool.query(
          'UPDATE "user" SET status = $1 WHERE username = $2 RETURNING *',
          [true, username]
        );
        
    
        const token = jwt.sign({
            user: result.rows[0].id,
            username: result.rows[0].username
        }, SECRET_KEY, { expiresIn: '1h' });
    
        res.json({ token });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
    }
);


/**
 * LOGOUT USER
 */
app.post('/logout', async (req, res) => {
  const { token } = req.body;
  if (!token)   return res.status(400).json({ messageError: 'Token manquant' });
  
  try {
    const decodedToken = jwt.decode(token);
    if (decodedToken === null)  return res.status(400).json({ messageError: 'Token invalide' });

    const decoded = jwt.verify(token, SECRET_KEY);
    
    const id = decoded.user;

    await pool.query(
      'UPDATE "user" SET status = $1 WHERE id = $2 RETURNING *',
      [false, id]
    );

    res.status(201).json({message : "Vous êtez déconnecté"});
  } catch (error) {
    console.error('Error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});


/**
 * GET INFO USER BY TOKEN
 */
app.post('/getinfouser', async (req, res) => {
  const { token } = req.body;
if (!token)   return res.status(400).json({ messageError: 'Token manquant' });
  
  try {
    const decodedToken = jwt.decode(token);
    if (decodedToken === null)  return res.status(400).json({ messageError: 'Token invalide' });

    const decoded = jwt.verify(token, SECRET_KEY);
    
    const user = decoded;

    

    res.status(201).json({
      message : "Vos informations",
      data: user
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});


/**
 * ENVOYER UN MESSAGE
 */
app.post('/sendmessage', async (req, res) => {
  const { token, content, receiverId } = req.body;

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const senderId = decoded.user;
    const dateNow = new Date()

    const message = await pool.query('INSERT INTO "message" (content, receiver_id, sender_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING *', [content, receiverId, senderId, dateNow, dateNow]);
    

    // Send the message to the sender and the receiver using Socket.IO
    io.emit('new_message', message);
    

    res.status(201).json(message.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});



/**
 * GET INFO USER BY ID
 */
app.get('/getinfouser/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await pool.query('SELECT * FROM "user" WHERE id = $1', [userId]);

    res.status(201).json({
      message : "Vos informations",
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});


/**
 * RECUPERER LES MESSAGES D'UNE UTILISATEUR
 */
app.post('/mymessage/:userId', async (req, res) => {
  const { userId } = req.params;
  const token = req.body.token; 
  if (!token) {
    return res.status(401).json({ messageError: 'Token manquante' });
  }

  try {
    const decodedToken = jwt.decode(token);
    if (decodedToken === null)  return res.status(401).json({ messageError: 'Token invalide' });

    const decoded = jwt.verify(token, SECRET_KEY);
    const currentUserId = decoded.user;
    const result = await pool.query(
      `
      SELECT * 
      FROM message 
      WHERE (sender_id = $1 AND receiver_id = $2)
         OR (sender_id = $2 AND receiver_id = $1)
      ORDER BY created_at ASC
      `,
      [currentUserId, userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(401).json({ error: 'Invalid token' });
  }
});



server.listen(port, () => {
  console.log(`Serveur Node.js démarré sur le port ${port}`);
});
