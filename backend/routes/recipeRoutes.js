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
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const fileFilter = (req, file, cb) => {
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype))
    cb(null, true);
  else
    cb(new Error('Tipo de arquivo não suportado.'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 }
});

router.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// =====================================================================
// FEED PRINCIPAL
// =====================================================================
router.get('/feed', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const [results] = await db.query(`
      SELECT 
        r.id,
        r.prato,
        r.descricao,
        r.url_imagem,
        r.data_postagem,
        r.usuario_id,

        u.nome_usuario,
        u.foto_perfil_url,

        (SELECT COUNT(*) FROM curtidas WHERE receita_id = r.id) AS totalCurtidas,
        (SELECT COUNT(*) FROM comentarios WHERE receita_id = r.id) AS totalComentarios,
        EXISTS(SELECT 1 FROM curtidas WHERE receita_id = r.id AND usuario_id = ?) AS isLikedByMe,

        ROUND(AVG(a.nota), 1) AS avgAval,
        COUNT(a.id) AS totalAval

      FROM receitas r
      JOIN usuarios u ON r.usuario_id = u.id
      LEFT JOIN avaliacoes a ON a.receita_id = r.id
      GROUP BY r.id
      ORDER BY r.data_postagem DESC
    `, [userId]);

    res.json({ receitas: results, page: 1, hasMore: false });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao buscar feed.' });
  }
});

// =====================================================================
// CRIAR RECEITA
// =====================================================================
router.post('/', authMiddleware, upload.single('imagemReceita'), async (req, res) => {
  const {
    prato, ingredientes, preparacao, descricao,
    tempo_preparo, dificuldade, custo, rendimento, cozimento
  } = req.body;

  const userId = req.user.id;
  const url_imagem = req.file ? `/uploads/${req.file.filename}` : null;

  if (!prato || !ingredientes || !preparacao) {
    if (req.file) fs.unlink(req.file.path, () => {});
    return res.status(400).json({ mensagem: 'Campos obrigatórios faltando.' });
  }

  try {
    const [result] = await db.query(`
      INSERT INTO receitas (
        usuario_id, prato, ingredientes, preparacao, descricao,
        tempo_preparo, dificuldade, custo, rendimento, url_imagem, cozimento
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, prato, ingredientes, preparacao, descricao || null,
      tempo_preparo || null, dificuldade || null, custo || null,
      rendimento || null, url_imagem, cozimento || null
    ]);

    res.status(201).json({ mensagem: 'Receita criada!', receitaId: result.insertId });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao criar receita.' });
  }
});

// =====================================================================
// RECEITAS DE UM USUÁRIO
// =====================================================================
router.get('/user/:userId', authMiddleware, async (req, res) => {
  const uId = req.params.userId;
  const currentUser = req.user.id;

  try {
    const [results] = await db.query(`
      SELECT 
        r.id,
        r.prato,
        r.descricao,
        r.url_imagem,
        r.data_postagem,

        u.nome_usuario,
        u.foto_perfil_url,

        (SELECT COUNT(*) FROM curtidas WHERE receita_id = r.id) AS totalCurtidas,
        (SELECT COUNT(*) FROM comentarios WHERE receita_id = r.id) AS totalComentarios,
        EXISTS(SELECT 1 FROM curtidas WHERE receita_id = r.id AND usuario_id = ?) AS isLikedByMe,

        ROUND(AVG(a.nota), 1) AS mediaNotas,
        COUNT(a.id) AS totalAvaliacoes

      FROM receitas r
      JOIN usuarios u ON r.usuario_id = u.id
      LEFT JOIN avaliacoes a ON r.id = a.receita_id
      WHERE r.usuario_id = ?
      GROUP BY r.id
      ORDER BY r.data_postagem DESC
    `, [currentUser, uId]);

    res.json(results);

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao buscar receitas do usuário.' });
  }
});

// =====================================================================
// MINHAS RECEITAS
// =====================================================================
router.get('/my-recipes', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const [results] = await db.query(`
      SELECT 
        r.id,
        r.prato,
        r.descricao,
        r.url_imagem,
        r.data_postagem,
        u.nome_usuario,
        u.foto_perfil_url,

        (SELECT COUNT(*) FROM curtidas WHERE receita_id = r.id) AS totalCurtidas,
        (SELECT COUNT(*) FROM comentarios WHERE receita_id = r.id) AS totalComentarios,
        EXISTS(SELECT 1 FROM curtidas WHERE receita_id = r.id AND usuario_id = ?) AS isLikedByMe,

        AVG(a.nota) AS mediaNotas,
        COUNT(a.id) AS totalAvaliacoes

      FROM receitas r
      JOIN usuarios u ON r.usuario_id = u.id
      LEFT JOIN avaliacoes a ON r.id = a.receita_id

      WHERE r.usuario_id = ?
      GROUP BY r.id
      ORDER BY r.data_postagem DESC
    `, [userId, userId]);

    res.json(results);

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao buscar suas receitas.' });
  }
});

// =====================================================================
// RECEITAS CURTIDAS
// =====================================================================
router.get('/liked', authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const [results] = await db.query(`
      SELECT 
        r.id,
        r.prato,
        r.descricao,
        r.url_imagem,
        r.data_postagem,

        u.nome_usuario,
        u.foto_perfil_url,

        (SELECT COUNT(*) FROM curtidas WHERE receita_id = r.id) AS totalCurtidas,
        (SELECT COUNT(*) FROM comentarios WHERE receita_id = r.id) AS totalComentarios,

        1 AS isLikedByMe,

        AVG(a.nota) AS mediaNotas,
        COUNT(a.id) AS totalAvaliacoes

      FROM receitas r
      JOIN curtidas c ON r.id = c.receita_id
      JOIN usuarios u ON r.usuario_id = u.id
      LEFT JOIN avaliacoes a ON r.id = a.receita_id

      WHERE c.usuario_id = ?
      GROUP BY r.id
      ORDER BY c.data_curtida DESC
    `, [userId]);

    res.json(results);

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao buscar curtidas.' });
  }
});

// =====================================================================
// 🔍 BUSCA DE RECEITAS
// =====================================================================
router.get('/search', authMiddleware, async (req, res) => {
  const q = (req.query.q || '').toString().trim();

  if (!q) {
    return res.json([]);
  }

  const like = `%${q}%`;

  try {
    const [rows] = await db.query(
      `
      SELECT
        r.id,
        r.prato,
        r.descricao,
        r.url_imagem,
        r.usuario_id,
        u.nome_usuario
      FROM receitas AS r
      JOIN usuarios AS u ON r.usuario_id = u.id
      WHERE
        r.prato LIKE ?
        OR r.descricao LIKE ?
        OR r.ingredientes LIKE ?
      ORDER BY r.data_postagem DESC
      LIMIT 20
      `,
      [like, like, like]
    );

    res.json(rows);

  } catch (error) {
    console.error('Erro na busca de receitas:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar receitas.' });
  }
});

// =====================================================================
// DETALHES DA RECEITA
// =====================================================================
router.get('/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;

  try {
    const [rows] = await db.query(`
      SELECT 
        r.*,
        u.nome_usuario,
        u.foto_perfil_url,

        (SELECT COUNT(*) FROM curtidas WHERE receita_id = r.id) AS totalCurtidas,
        (SELECT COUNT(*) FROM comentarios WHERE receita_id = r.id) AS totalComentarios,
        EXISTS(SELECT 1 FROM curtidas WHERE receita_id = r.id AND usuario_id = ?) AS isLikedByMe,

        AVG(a.nota) AS mediaNotas,
        COUNT(a.id) AS totalAvaliacoes

      FROM receitas r
      JOIN usuarios u ON r.usuario_id = u.id
      LEFT JOIN avaliacoes a ON r.id = a.receita_id

      WHERE r.id = ?
      GROUP BY r.id
    `, [userId, id]);

    if (!rows[0]) return res.status(404).json({ mensagem: 'Receita não encontrada.' });

    res.json(rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao buscar receita.' });
  }
});

// =====================================================================
// EXCLUIR RECEITA
// =====================================================================
router.delete('/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;

  try {
    const [rows] = await db.query('SELECT usuario_id, url_imagem FROM receitas WHERE id = ?', [id]);

    if (!rows[0]) return res.status(404).json({ mensagem: 'Receita não encontrada.' });

    if (rows[0].usuario_id !== userId)
      return res.status(403).json({ mensagem: 'Sem permissão.' });

    if (rows[0].url_imagem) {
      const imgPath = path.join(__dirname, '../public', rows[0].url_imagem);
      fs.unlink(imgPath, () => {});
    }

    await db.query('DELETE FROM receitas WHERE id = ?', [id]);

    res.json({ mensagem: 'Receita excluída!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao excluir receita.' });
  }
});

// =====================================================================
// ATUALIZAR RECEITA
// =====================================================================
router.put('/:id', authMiddleware, upload.single('imagemReceita'), async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;

  const {
    prato, ingredientes, preparacao, descricao,
    tempo_preparo, dificuldade, custo, rendimento, cozimento
  } = req.body;

  try {
    const [rows] = await db.query(
      'SELECT usuario_id, url_imagem FROM receitas WHERE id = ?',
      [id]
    );

    if (!rows[0]) return res.status(404).json({ mensagem: 'Receita não encontrada.' });

    if (rows[0].usuario_id !== userId)
      return res.status(403).json({ mensagem: 'Sem permissão.' });

    let url_imagem = rows[0].url_imagem;

    if (req.file) {
      url_imagem = `/uploads/${req.file.filename}`;

      if (rows[0].url_imagem) {
        const oldImg = path.join(__dirname, '../public', rows[0].url_imagem);
        fs.unlink(oldImg, () => {});
      }
    }

    await db.query(`
      UPDATE receitas SET 
        prato = ?, ingredientes = ?, preparacao = ?, descricao = ?,
        tempo_preparo = ?, dificuldade = ?, custo = ?, rendimento = ?,
        url_imagem = ?, cozimento = ?
      WHERE id = ?
    `, [
      prato, ingredientes, preparacao, descricao || null, tempo_preparo || null,
      dificuldade || null, custo || null, rendimento || null,
      url_imagem, cozimento || null, id
    ]);

    res.json({ mensagem: 'Receita atualizada!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao atualizar receita.' });
  }
});

// =====================================================================
// CURTIR / DESCURTIR RECEITA
// =====================================================================
router.post('/:id/like', authMiddleware, async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      'SELECT id FROM curtidas WHERE usuario_id = ? AND receita_id = ?',
      [userId, id]
    );

    if (rows[0]) {
      await db.query('DELETE FROM curtidas WHERE id = ?', [rows[0].id]);

      const [[count]] = await db.query(
        'SELECT COUNT(*) AS total FROM curtidas WHERE receita_id = ?',
        [id]
      );

      return res.json({ liked: false, totalCurtidas: count.total });
    }

    await db.query(
      'INSERT INTO curtidas (usuario_id, receita_id) VALUES (?, ?)',
      [userId, id]
    );

    const [[count]] = await db.query(
      'SELECT COUNT(*) AS total FROM curtidas WHERE receita_id = ?',
      [id]
    );

    res.json({ liked: true, totalCurtidas: count.total });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao curtir.' });
  }
});

// =====================================================================
// COMENTÁRIOS – LISTAR (com likes/dislikes)
// =====================================================================
router.get('/:id/comments', authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;
  const userId = req.user.id;

  try {
    const [comments] = await db.query(`
      SELECT
        c.id,
        c.texto AS comentario,
        c.data_comentario,
        c.usuario_id,

        u.nome_usuario,
        u.foto_perfil_url,

        -- contagem de likes
        (SELECT COUNT(*) FROM comentario_reacoes cr 
          WHERE cr.comentario_id = c.id AND cr.tipo = 'like') AS likes,

        -- contagem de dislikes
        (SELECT COUNT(*) FROM comentario_reacoes cr 
          WHERE cr.comentario_id = c.id AND cr.tipo = 'dislike') AS dislikes,

        -- reação do usuário logado (like, dislike ou NULL)
        (SELECT cr.tipo FROM comentario_reacoes cr 
          WHERE cr.comentario_id = c.id AND cr.usuario_id = ? LIMIT 1) AS minhaReacao

      FROM comentarios c
      JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.receita_id = ?
      ORDER BY c.data_comentario DESC
      LIMIT ? OFFSET ?
    `, [userId, req.params.id, limit, offset]);

    res.json({
      comments,
      page,
      hasMore: comments.length === limit
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao carregar comentários.' });
  }
});

// =====================================================================
// POSTAR COMENTÁRIO
// =====================================================================
router.post('/:id/comment', authMiddleware, async (req, res) => {
  const { comentario } = req.body;
  const receitaId = req.params.id;
  const userId = req.user.id;

  if (!comentario) return res.status(400).json({ mensagem: 'Comentário vazio.' });

  try {
    const [result] = await db.query(`
      INSERT INTO comentarios (receita_id, usuario_id, texto)
      VALUES (?, ?, ?)
    `, [receitaId, userId, comentario]);

    const [[novo]] = await db.query(`
      SELECT 
        c.id,
        c.texto AS comentario,
        c.data_comentario,
        c.usuario_id,
        u.nome_usuario,
        u.foto_perfil_url,
        0 AS likes,
        0 AS dislikes,
        NULL AS minhaReacao
      FROM comentarios c
      JOIN usuarios u ON u.id = c.usuario_id
      WHERE c.id = ?
    `, [result.insertId]);

    res.json({ comentario: novo });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao postar comentário.' });
  }
});

// =====================================================================
// EXCLUIR COMENTÁRIO
// =====================================================================
router.delete('/comments/:commentId', authMiddleware, async (req, res) => {
  const commentId = req.params.commentId;
  const userId = req.user.id;

  try {
    const [[comentario]] = await db.query(
      'SELECT usuario_id FROM comentarios WHERE id = ?',
      [commentId]
    );

    if (!comentario) {
      return res.status(404).json({ mensagem: 'Comentário não encontrado.' });
    }

    if (comentario.usuario_id !== userId) {
      return res.status(403).json({ mensagem: 'Sem permissão para excluir este comentário.' });
    }

    // remove reações ligadas a esse comentário
    await db.query('DELETE FROM comentario_reacoes WHERE comentario_id = ?', [commentId]);
    await db.query('DELETE FROM comentarios WHERE id = ?', [commentId]);

    res.json({ mensagem: 'Comentário excluído com sucesso.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao excluir comentário.' });
  }
});

// =====================================================================
// LIKE / DISLIKE EM COMENTÁRIO
// =====================================================================
router.post('/comments/:commentId/react', authMiddleware, async (req, res) => {
  const commentId = req.params.commentId;
  const userId = req.user.id;
  const { tipo } = req.body; // 'like' ou 'dislike'

  if (!['like', 'dislike'].includes(tipo)) {
    return res.status(400).json({ mensagem: 'Tipo de reação inválido.' });
  }

  try {
    const [[existente]] = await db.query(
      'SELECT * FROM comentario_reacoes WHERE comentario_id = ? AND usuario_id = ?',
      [commentId, userId]
    );

    let novaReacao = null;

    if (!existente) {
      // não existe ainda -> cria
      await db.query(
        'INSERT INTO comentario_reacoes (comentario_id, usuario_id, tipo) VALUES (?, ?, ?)',
        [commentId, userId, tipo]
      );
      novaReacao = tipo;
    } else if (existente.tipo === tipo) {
      // mesma reação -> remove (toggle off)
      await db.query(
        'DELETE FROM comentario_reacoes WHERE id = ?',
        [existente.id]
      );
      novaReacao = null;
    } else {
      // reação diferente -> atualiza
      await db.query(
        'UPDATE comentario_reacoes SET tipo = ? WHERE id = ?',
        [tipo, existente.id]
      );
      novaReacao = tipo;
    }

    const [[contagens]] = await db.query(
      `SELECT
         SUM(tipo = 'like')   AS likes,
         SUM(tipo = 'dislike') AS dislikes
       FROM comentario_reacoes
       WHERE comentario_id = ?`,
      [commentId]
    );

    res.json({
      mensagem: 'Reação registrada.',
      likes: contagens.likes || 0,
      dislikes: contagens.dislikes || 0,
      minhaReacao: novaReacao
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao registrar reação.' });
  }
});

// =====================================================================
// AVALIAÇÕES
// =====================================================================
router.post('/:id/avaliar', authMiddleware, async (req, res) => {
  const id = req.params.id;
  const userId = req.user.id;
  const { nota, comentario } = req.body;

  if (!nota) return res.status(400).json({ mensagem: 'Nota obrigatória.' });

  try {
    const [[existente]] = await db.query(`
      SELECT comentario FROM avaliacoes
      WHERE usuario_id = ? AND receita_id = ?
    `, [userId, id]);

    if (existente) {
      const finalComentario = comentario?.trim() || existente.comentario;

      await db.query(`
        UPDATE avaliacoes
        SET nota = ?, comentario = ?
        WHERE usuario_id = ? AND receita_id = ?
      `, [nota, finalComentario, userId, id]);

      return res.json({ mensagem: 'Avaliação atualizada!' });
    }

    await db.query(`
      INSERT INTO avaliacoes (receita_id, usuario_id, nota, comentario)
      VALUES (?, ?, ?, ?)
    `, [id, userId, nota, comentario || '']);

    res.json({ mensagem: 'Avaliação publicada!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao avaliar.' });
  }
});

// =====================================================================
// AVALIAÇÕES - LISTAR
// =====================================================================
router.get('/:id/avaliacoes', async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT COUNT(*) AS totalAvaliacoes, AVG(nota) AS mediaNotas
      FROM avaliacoes
      WHERE receita_id = ?
    `, [req.params.id]);

    const [comentarios] = await db.query(`
      SELECT
        a.id,
        a.usuario_id,
        a.comentario,
        a.nota,
        a.data_avaliacao,

        u.nome_usuario,
        u.foto_perfil_url

      FROM avaliacoes a
      JOIN usuarios u ON a.usuario_id = u.id
      WHERE a.receita_id = ? AND a.comentario IS NOT NULL
      ORDER BY a.data_avaliacao DESC
    `, [req.params.id]);

    res.json({ stats: stats[0], comentarios });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao listar avaliações.' });
  }
});

// =====================================================================
// DELETAR AVALIAÇÃO
// =====================================================================
router.delete('/:id/avaliacoes/:avaliacaoId', authMiddleware, async (req, res) => {
  const avaliacaoId = req.params.avaliacaoId;
  const userId = req.user.id;

  try {
    const [[avaliacao]] = await db.query(
      'SELECT usuario_id FROM avaliacoes WHERE id = ?',
      [avaliacaoId]
    );

    if (!avaliacao)
      return res.status(404).json({ mensagem: 'Avaliação não encontrada.' });

    if (avaliacao.usuario_id !== userId)
      return res.status(403).json({ mensagem: 'Sem permissão.' });

    await db.query('DELETE FROM avaliacoes WHERE id = ?', [avaliacaoId]);

    res.json({ mensagem: 'Avaliação removida!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao excluir avaliação.' });
  }
});

// =====================================================================
// 🔍 (ANTIGA) BUSCA – MANTIDA APENAS SE VOCÊ AINDA USA EM ALGUM LUGAR
// =====================================================================
router.get('/search', authMiddleware, async (req, res) => {
  const q = (req.query.q || '').toString().trim();

  if (!q) {
    return res.json([]);
  }
  const like = `%${q}%`;

  try {
    const [rows] = await db.query(
      `
      SELECT
        r.id,
        r.prato,
        r.descricao,
        r.url_imagem,
        r.usuario_id,
        u.nome_usuario
      FROM receitas AS r
      JOIN usuarios AS u ON r.usuario_id = u.id
      WHERE
        r.prato       LIKE ?
        OR r.descricao    LIKE ?
        OR r.ingredientes LIKE ?
      ORDER BY r.data_postagem DESC
      LIMIT 20
      `,
      [like, like, like]
    );

    res.json(rows);
  } catch (error) {
    console.error('Erro na busca de receitas:', error);
    res.status(500).json({ mensagem: 'Erro ao buscar receitas.' });
  }
});

module.exports = router;
