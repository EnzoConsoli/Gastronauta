// routes/userRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// ROTA PARA MUDAR SENHA (POST /api/users/change-password)
// Esta rota é protegida pelo nosso middleware
router.post('/change-password', authMiddleware, async (req, res) => {
  const { senha_atual, nova_senha } = req.body;
  const userId = req.user.id; // O ID do usuário vem do token verificado pelo middleware

  if (!senha_atual || !nova_senha) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios.' });
  }

  try {
    const [rows] = await db.query('SELECT senha_hash FROM usuarios WHERE id = ?', [userId]);
    const user = rows[0];

    const isMatch = await bcrypt.compare(senha_atual, user.senha_hash);
    if (!isMatch) {
      return res.status(403).json({ mensagem: 'A senha atual está incorreta.' });
    }

    const newHashedPassword = await bcrypt.hash(nova_senha, 10);
    await db.query('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [newHashedPassword, userId]);

    res.json({ mensagem: 'Senha alterada com sucesso.' });

  } catch (error) {
    res.status(500).json({ mensagem: 'Erro no servidor.', erro: error.message });
  }
});

// ROTA PARA DELETAR CONTA (DELETE /api/users/delete-account)
router.delete('/delete-account', authMiddleware, async (req, res) => {
  const { senha } = req.body; // Pede a senha para confirmação
  const userId = req.user.id;

  if (!senha) {
    return res.status(400).json({ mensagem: 'A senha é obrigatória para confirmar a exclusão.' });
  }

  const connection = await db.getConnection(); // Pega uma conexão do pool para usar a transação
  try {
    const [rows] = await connection.query('SELECT senha_hash FROM usuarios WHERE id = ?', [userId]);
    const user = rows[0];

    const isMatch = await bcrypt.compare(senha, user.senha_hash);
    if (!isMatch) {
      connection.release();
      return res.status(403).json({ mensagem: 'Senha incorreta. Exclusão cancelada.' });
    }

    // Inicia a transação
    await connection.beginTransaction();

    // Deleta os dados relacionados em ordem para não violar as chaves estrangeiras
    await connection.query('DELETE FROM curtidas WHERE id_usuario = ?', [userId]);
    await connection.query('DELETE FROM comentarios WHERE id_usuario = ?', [userId]);
    await connection.query('DELETE FROM receitas_categorias WHERE id_receita IN (SELECT id FROM receitas WHERE id_usuario = ?)', [userId]);
    await connection.query('DELETE FROM receitas WHERE id_usuario = ?', [userId]);
    await connection.query('DELETE FROM seguidores WHERE id_seguidor = ? OR id_seguindo = ?', [userId, userId]);
    
    // Finalmente, deleta o usuário
    await connection.query('DELETE FROM usuarios WHERE id = ?', [userId]);

    // Confirma a transação
    await connection.commit();
    
    res.json({ mensagem: 'Conta deletada com sucesso.' });

  } catch (error) {
    await connection.rollback(); // Desfaz tudo se der algum erro
    res.status(500).json({ mensagem: 'Erro ao deletar a conta.', erro: error.message });
  } finally {
    connection.release(); // Libera a conexão de volta para o pool
  }
});

module.exports = router;