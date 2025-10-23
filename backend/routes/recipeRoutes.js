// routes/recipeRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Configuração do Multer ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads'); // Garante que esta pasta exista!
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado.'), false);
  }
};
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // 5MB
});
// --- Fim Multer ---

// ===================================================================
// === >>>>> CORREÇÃO CRÍTICA ADICIONADA AQUI <<<<< ===
// ===================================================================
// Esta linha "publica" a pasta 'public/uploads' e a torna acessível
// pela URL '/uploads'.
router.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));


// =======================================================
// === ROTA PARA CRIAR RECEITA (POST /) - (PREENCHIDA) ===
// =======================================================
router.post('/', authMiddleware, upload.single('imagemReceita'), async (req, res) => {
  const { 
    prato, ingredientes, preparacao, descricao, tempo_preparo, 
    dificuldade, custo, rendimento, cozimento
  } = req.body;
  const usuarioId = req.user.id;
  const url_imagem = req.file ? `/uploads/${req.file.filename}` : null;

  if (!prato || !ingredientes || !preparacao) {
    if (req.file) fs.unlink(req.file.path, (err) => { if (err) console.error("Erro ao apagar arquivo:", err); });
    return res.status(400).json({ mensagem: 'Título, ingredientes e modo de preparo são obrigatórios.' });
  }
  
  try {
    const [result] = await db.query(
      `INSERT INTO receitas (
         usuario_id, prato, ingredientes, preparacao, descricao, 
         tempo_preparo, dificuldade, custo, rendimento, url_imagem, cozimento
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuarioId, prato, ingredientes, preparacao, descricao || null, 
        tempo_preparo || null, dificuldade || null, custo || null, rendimento || null, url_imagem, cozimento || null
      ]
    );
    res.status(201).json({ mensagem: 'Receita criada com sucesso!', receitaId: result.insertId });
  } catch (error) {
    console.error('Erro ao criar receita:', error); // <<< Log crucial para o terminal
    if (req.file) fs.unlink(req.file.path, (err) => { if (err) console.error("Erro ao apagar arquivo:", err); });
    res.status(500).json({ mensagem: 'Erro no servidor ao criar a receita.' });
  }
});

// ===================================================================
// === ROTA PARA BUSCAR TODAS AS RECEITAS (GET /) - (PREENCHIDA) ===
// ===================================================================
router.get('/', async (req, res) => {
  try {
    const [receitas] = await db.query(`
      SELECT r.id, r.prato, r.descricao, r.url_imagem, r.data_postagem, u.nome_usuario 
      FROM receitas AS r JOIN usuarios AS u ON r.usuario_id = u.id ORDER BY r.data_postagem DESC
    `);
    res.json(receitas);
  } catch (error) {
    console.error('Erro ao buscar receitas:', error);
    res.status(500).json({ mensagem: 'Erro no servidor ao buscar as receitas.' });
  }
});

// =======================================================================
// === ROTA PARA BUSCAR MINHAS RECEITAS (GET /my-recipes) - (PREENCHIDA) ===
// =======================================================================
router.get('/my-recipes', authMiddleware, async (req, res) => {
  const usuarioId = req.user.id;
  try {
    const [myRecipes] = await db.query('SELECT * FROM receitas WHERE usuario_id = ? ORDER BY data_postagem DESC', [usuarioId]);
    res.json(myRecipes);
  } catch (error) {
    console.error('Erro ao buscar minhas receitas:', error);
    res.status(500).json({ mensagem: 'Erro no servidor ao buscar suas receitas.' });
  }
});

// =======================================================================
// === ROTA PARA BUSCAR RECEITAS CURTIDAS (GET /liked) - (PREENCHIDA) ===
// =======================================================================
router.get('/liked', authMiddleware, async (req, res) => {
  const usuarioId = req.user.id;
  try {
    const [likedRecipes] = await db.query(`
      SELECT r.id, r.prato, r.descricao, r.url_imagem, r.data_postagem, u.nome_usuario 
      FROM receitas AS r JOIN curtidas AS c ON r.id = c.receita_id JOIN usuarios AS u ON r.usuario_id = u.id
      WHERE c.usuario_id = ? ORDER BY c.data_curtida DESC
    `, [usuarioId]);
    res.json(likedRecipes);
  } catch (error) {
    console.error('Erro ao buscar receitas curtidas:', error);
    res.status(500).json({ mensagem: 'Erro no servidor ao buscar suas receitas curtidas.' });
  }
});

// ==================================================================================
// === ROTA PARA BUSCAR DETALHES DE UMA RECEITA (GET /:id) - (PREENCHIDA) ===
// ==================================================================================
router.get('/:id', async (req, res) => {
  const receitaId = req.params.id;
  try {
    const [rows] = await db.query(`
      SELECT r.*, u.nome_usuario 
      FROM receitas AS r JOIN usuarios AS u ON r.usuario_id = u.id
      WHERE r.id = ?
    `, [receitaId]);
    const recipe = rows[0];
    if (!recipe) { return res.status(404).json({ mensagem: 'Receita não encontrada.' }); }
    res.json(recipe);
  } catch (error) {
    console.error('Erro ao buscar detalhes da receita:', error);
    res.status(500).json({ mensagem: 'Erro no servidor ao buscar a receita.' });
  }
});

// ===================================================================
// === ROTA PARA EXCLUIR UMA RECEITA (DELETE /:id) - (PREENCHIDA) ===
// ===================================================================
router.delete('/:id', authMiddleware, async (req, res) => {
  const receitaId = req.params.id;
  const usuarioId = req.user.id;
  try {
    const [rows] = await db.query('SELECT usuario_id, url_imagem FROM receitas WHERE id = ?', [receitaId]);
    const recipe = rows[0];
    if (!recipe) { return res.status(404).json({ mensagem: 'Receita não encontrada.' }); }
    if (recipe.usuario_id !== usuarioId) { return res.status(403).json({ mensagem: 'Você não tem permissão para excluir esta receita.' }); }
    if (recipe.url_imagem) {
      const imagePath = path.join(__dirname, '../public', recipe.url_imagem);
      fs.unlink(imagePath, (err) => { if (err) console.error("Erro ao apagar imagem antiga:", err); });
    }
    await db.query('DELETE FROM receitas WHERE id = ?', [receitaId]);
    res.json({ mensagem: 'Receita excluída com sucesso!' });
  } catch (error) {
    console.error('Erro ao excluir receita:', error);
    res.status(500).json({ mensagem: 'Erro no servidor ao excluir a receita.' });
  }
});

// =====================================================================
// === ROTA PARA ATUALIZAR UMA RECEITA (PUT /:id) - (PREENCHIDA) ===
// =====================================================================
router.put('/:id', authMiddleware, upload.single('imagemReceita'), async (req, res) => {
  const receitaId = req.params.id;
  const usuarioId = req.user.id;
  const {
    prato, ingredientes, preparacao, descricao, tempo_preparo,
    dificuldade, custo, rendimento, cozimento
  } = req.body;
  let url_imagem = req.body.url_imagem_existente || null;
  try {
    const [rows] = await db.query('SELECT usuario_id, url_imagem FROM receitas WHERE id = ?', [receitaId]);
    const recipe = rows[0];
    if (!recipe) { return res.status(404).json({ mensagem: 'Receita não encontrada.' }); }
    if (recipe.usuario_id !== usuarioId) { return res.status(403).json({ mensagem: 'Você não tem permissão para editar esta receita.' }); }
    if (req.file) {
      url_imagem = `/uploads/${req.file.filename}`;
      if (recipe.url_imagem) {
        const oldImagePath = path.join(__dirname, '../public', recipe.url_imagem);
        fs.unlink(oldImagePath, (err) => { if (err) console.error("Erro ao apagar imagem antiga na atualização:", err); });
      }
    }
    if (!prato || !ingredientes || !preparacao) { return res.status(400).json({ mensagem: 'Título, ingredientes e modo de preparo são obrigatórios.' }); }
    await db.query(
      `UPDATE receitas SET 
         prato = ?, ingredientes = ?, preparacao = ?, descricao = ?, 
         tempo_preparo = ?, dificuldade = ?, custo = ?, rendimento = ?, url_imagem = ?, cozimento = ?
       WHERE id = ?`,
      [prato, ingredientes, preparacao, descricao || null, tempo_preparo || null, dificuldade || null, custo || null, rendimento || null, url_imagem, cozimento || null, receitaId]
    );
    res.json({ mensagem: 'Receita atualizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao atualizar receita:', error);
    res.status(500).json({ mensagem: 'Erro no servidor ao atualizar a receita.' });
  }
});

// ===================================================================
// === ROTA PARA PUBLICAR UMA AVALIAÇÃO (POST /:id/avaliar) ===
// ===================================================================
router.post('/:id/avaliar', authMiddleware, async (req, res) => {
  const receitaId = req.params.id;
  const usuarioId = req.user.id;
  const { nota, comentario } = req.body;
  if (!nota || nota < 1 || nota > 5) {
    return res.status(400).json({ mensagem: 'A nota (de 1 a 5) é obrigatória.' });
  }
  try {
    await db.query(
      `INSERT INTO avaliacoes (receita_id, usuario_id, nota, comentario)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nota = ?, comentario = ?`,
      [receitaId, usuarioId, nota, comentario, nota, comentario]
    );
    res.status(201).json({ mensagem: 'Avaliação publicada com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar avaliação:', error);
    res.status(500).json({ mensagem: 'Erro no servidor ao salvar avaliação.' });
  }
});

// ========================================================================
// === ROTA PARA BUSCAR AVALIAÇÕES DE UMA RECEITA (GET /:id/avaliacoes) ===
// ========================================================================
router.get('/:id/avaliacoes', async (req, res) => {
  const receitaId = req.params.id;
  try {
    const [stats] = await db.query(
      `SELECT COUNT(id) as totalAvaliacoes, AVG(nota) as mediaNotas 
       FROM avaliacoes 
       WHERE receita_id = ?`,
      [receitaId]
    );
    const [comentarios] = await db.query(
      `SELECT a.comentario, a.nota, u.nome_usuario
       FROM avaliacoes AS a
       JOIN usuarios AS u ON a.usuario_id = u.id
       WHERE a.receita_id = ? AND a.comentario IS NOT NULL
       ORDER BY a.data_avaliacao DESC`,
      [receitaId]
    );
    res.json({
      stats: stats[0],
      comentarios: comentarios
    });
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    res.status(500).json({ mensagem: 'Erro no servidor ao buscar avaliações.' });
  }
});

module.exports = router;