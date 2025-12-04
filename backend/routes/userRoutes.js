// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ======================================================================
// MULTER – UPLOAD DE AVATAR
// ======================================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/avatars'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const fileFilter = (req, file, cb) => {
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
  else cb(new Error('Tipo de arquivo não suportado.'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 2 }
});

// ======================================================================
// PERFIL DO USUÁRIO LOGADO
// ======================================================================
router.get('/profile', authMiddleware, async (req, res) => {
  const usuarioId = req.user.id;

  try {
    const [rows] = await db.query(
      'SELECT id, nome_usuario, email, nome_completo, bio, foto_perfil_url FROM usuarios WHERE id = ?',
      [usuarioId]
    );

    if (rows.length === 0) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });

    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ mensagem: 'Erro no servidor.' });
  }
});

// ======================================================================
// ATUALIZAR PERFIL
// ======================================================================
router.put('/profile', authMiddleware, upload.single('fotoPerfil'), async (req, res) => {
  const usuarioId = req.user.id;
  const { nome_completo, bio } = req.body;

  let foto_perfil_url = req.body.foto_perfil_url_existente || null;

  try {
    const [userRows] = await db.query('SELECT foto_perfil_url FROM usuarios WHERE id = ?', [usuarioId]);
    const user = userRows[0];

    if (req.file) {
      foto_perfil_url = `/api/users/avatars/${req.file.filename}`;

      if (user?.foto_perfil_url) {
        const oldImageName = path.basename(user.foto_perfil_url);
        const oldImagePath = path.join(__dirname, '../public/avatars', oldImageName);
        fs.unlink(oldImagePath, () => {});
      }
    }

    await db.query(
      'UPDATE usuarios SET nome_completo = ?, bio = ?, foto_perfil_url = ? WHERE id = ?',
      [nome_completo || null, bio || null, foto_perfil_url, usuarioId]
    );

    res.json({ mensagem: 'Perfil atualizado com sucesso!', foto_perfil_url });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ mensagem: 'Erro no servidor ao atualizar perfil.' });
  }
});

// ======================================================================
// ALTERAR SENHA
// ======================================================================
router.post('/change-password', authMiddleware, async (req, res) => {
  const { senha_atual, nova_senha } = req.body;
  const userId = req.user.id;

  if (!senha_atual || !nova_senha) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios.' });
  }

  try {
    const [rows] = await db.query('SELECT senha_hash FROM usuarios WHERE id = ?', [userId]);
    const user = rows[0];

    const isMatch = await bcrypt.compare(senha_atual, user.senha_hash);
    if (!isMatch) return res.status(403).json({ mensagem: 'Senha atual incorreta.' });

    const newHashedPassword = await bcrypt.hash(nova_senha, 10);

    await db.query('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [newHashedPassword, userId]);

    res.json({ mensagem: 'Senha alterada com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro no servidor.' });
  }
});

// ======================================================================
// DELETAR FOTO DE PERFIL
// ======================================================================
router.delete('/profile-picture', authMiddleware, async (req, res) => {
  const usuarioId = req.user.id;

  try {
    const [rows] = await db.query('SELECT foto_perfil_url FROM usuarios WHERE id = ?', [usuarioId]);
    const user = rows[0];

    if (!user?.foto_perfil_url) {
      return res.status(200).json({ mensagem: 'Nenhuma foto para remover.' });
    }

    const oldImageName = path.basename(user.foto_perfil_url);
    const imagePath = path.join(__dirname, '../public/avatars', oldImageName);

    fs.unlink(imagePath, () => {});

    await db.query('UPDATE usuarios SET foto_perfil_url = NULL WHERE id = ?', [usuarioId]);

    res.json({ mensagem: 'Foto removida com sucesso!', foto_perfil_url: null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro no servidor.' });
  }
});

// ======================================================================
// FOLLOW SYSTEM
// ======================================================================

// SEGUIR
router.post('/seguir', authMiddleware, async (req, res) => {
  const seguidor_id = req.user.id;
  const { seguido_id } = req.body;

  try {
    if (seguidor_id === seguido_id) {
      return res.status(400).json({ mensagem: 'Você não pode seguir a si mesmo.' });
    }

    const [check] = await db.query(
      'SELECT * FROM seguidores WHERE seguidor_id = ? AND seguido_id = ?',
      [seguidor_id, seguido_id]
    );

    if (check.length > 0) {
      return res.json({ sucesso: true, mensagem: 'Já segue esse usuário.' });
    }

    await db.query(
      'INSERT INTO seguidores (seguidor_id, seguido_id) VALUES (?, ?)',
      [seguidor_id, seguido_id]
    );

    res.json({ sucesso: true });
  } catch (error) {
    console.error('Erro ao seguir:', error);
    res.status(500).json({ mensagem: 'Erro ao seguir.' });
  }
});

// DEIXAR DE SEGUIR
router.delete('/seguir', authMiddleware, async (req, res) => {
  const seguidor_id = req.user.id;
  const { seguido_id } = req.body;

  try {
    const [check] = await db.query(
      'SELECT * FROM seguidores WHERE seguidor_id = ? AND seguido_id = ?',
      [seguidor_id, seguido_id]
    );

    if (check.length === 0) {
      return res.json({ sucesso: true, mensagem: 'Você não seguia esse usuário.' });
    }

    await db.query(
      'DELETE FROM seguidores WHERE seguidor_id = ? AND seguido_id = ?',
      [seguidor_id, seguido_id]
    );

    res.json({ sucesso: true });
  } catch (error) {
    console.error('Erro ao deixar de seguir:', error);
    res.status(500).json({ mensagem: 'Erro ao deixar de seguir.' });
  }
});

// ======================================================================
// PERFIL DE QUALQUER USUÁRIO
// ======================================================================
router.get('/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const [rows] = await db.query(
      'SELECT id, nome_usuario, nome_completo, bio, foto_perfil_url FROM usuarios WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ mensagem: 'Erro no servidor.' });
  }
});

// ======================================================================
// CONTAGEM DE SEGUIDORES
// ======================================================================
router.get('/:id/followers', async (req, res) => {
  const userId = req.params.id;

  try {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS total FROM seguidores WHERE seguido_id = ?',
      [userId]
    );

    res.json({ total: rows[0].total });
  } catch (error) {
    console.error('Erro ao contar seguidores:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar seguidores.' });
  }
});

// ======================================================================
// CONTAGEM DE SEGUINDO
// ======================================================================
router.get('/:id/following', async (req, res) => {
  const userId = req.params.id;

  try {
    const [rows] = await db.query(
      'SELECT COUNT(*) AS total FROM seguidores WHERE seguidor_id = ?',
      [userId]
    );

    res.json({ total: rows[0].total });
  } catch (error) {
    console.error('Erro ao contar seguindo:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar seguindo.' });
  }
});

// ======================================================================
// LISTA DE SEGUIDORES (COM RELAÇÃO COM O LOGADO)
// ======================================================================
router.get('/:id/followers-list', authMiddleware, async (req, res) => {
  const viewedId = req.params.id;   // perfil visitado
  const loggedId = req.user.id;     // usuário logado

  try {
    const [rows] = await db.query(
      `SELECT 
         u.id,
         u.nome_usuario,
         u.foto_perfil_url,

         -- se VOCÊ segue essa pessoa
         (SELECT COUNT(*) FROM seguidores 
          WHERE seguidor_id = ? AND seguido_id = u.id) AS voceSegue,

         -- se ELA segue você
         (SELECT COUNT(*) FROM seguidores 
          WHERE seguidor_id = u.id AND seguido_id = ?) AS elaSegueVoce

       FROM seguidores s
       JOIN usuarios u ON s.seguidor_id = u.id   -- SEGUIDORES = quem segue
       WHERE s.seguido_id = ?`,
      [loggedId, loggedId, viewedId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar lista de seguidores:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar lista de seguidores.' });
  }
});

// ======================================================================
// LISTA DE QUEM O USUÁRIO SEGUE (COM RELAÇÃO COM O LOGADO)
// ======================================================================
router.get('/:id/following-list', authMiddleware, async (req, res) => {
  const viewedId = req.params.id;   // perfil visitado
  const loggedId = req.user.id;     // usuário logado

  try {
    const [rows] = await db.query(
      `SELECT 
         u.id,
         u.nome_usuario,
         u.foto_perfil_url,

         -- se VOCÊ segue essa pessoa
         (SELECT COUNT(*) FROM seguidores 
          WHERE seguidor_id = ? AND seguido_id = u.id) AS voceSegue,

         -- se ELA segue você
         (SELECT COUNT(*) FROM seguidores 
          WHERE seguidor_id = u.id AND seguido_id = ?) AS elaSegueVoce

       FROM seguidores s
       JOIN usuarios u ON s.seguido_id = u.id   -- SEGUINDO = quem eu sigo
       WHERE s.seguidor_id = ?`,
      [loggedId, loggedId, viewedId]
    );

    res.json(rows);
  } catch (error) {
    console.error('Erro ao buscar lista de seguindo:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar lista de seguindo.' });
  }
});
// ======================================================================
// VERIFICAR SE O USUÁRIO LOGADO SEGUE O PERFIL VISITADO
// ======================================================================
router.get('/:id/is-following', authMiddleware, async (req, res) => {
  const seguido_id = req.params.id;   // usuário visitado
  const seguidor_id = req.user.id;    // usuário logado

  try {
    const [rows] = await db.query(
      'SELECT 1 FROM seguidores WHERE seguidor_id = ? AND seguido_id = ?',
      [seguidor_id, seguido_id]
    );

    res.json({ seguindo: rows.length > 0 });
  } catch (error) {
    console.error('Erro ao verificar follow:', error);
    res.status(500).json({ mensagem: 'Erro ao verificar follow.' });
  }
});

module.exports = router;
