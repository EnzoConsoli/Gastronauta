const express = require('express');
const cors = require('cors');
const path = require('path'); // Importe o 'path'
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const recipeRoutes = require('./routes/recipeRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- ADICIONE ESTA LINHA ---
// Serve a pasta de avatares estaticamente
app.use('/api/users/avatars', express.static(path.join(__dirname, 'public/avatars')));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/receitas', recipeRoutes);

app.get('/', (req, res) => {
  res.send('API da Rede Social de Receitas está no ar!');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});