// routes/authRoutes.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const router = express.Router();

// =======================================================
// === ROTA DE CADASTRO (POST /api/auth/register) ===
// =======================================================
router.post('/register', async (req, res) => {
  const { nome_usuario, email, senha } = req.body;
  if (!nome_usuario || !email || !senha) {
    return res.status(400).json({ mensagem: 'Por favor, preencha todos os campos.' });
  }
  try {
    const hashedPassword = await bcrypt.hash(senha, 10);
    const [result] = await db.query(
      'INSERT INTO usuarios (nome_usuario, email, senha_hash) VALUES (?, ?, ?)',
      [nome_usuario, email, hashedPassword]
    );
    res.status(201).json({ mensagem: 'Usuário criado com sucesso!', usuarioId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensagem: 'Email ou nome de usuário já existe.' });
    }
    res.status(500).json({ mensagem: 'Erro no servidor.', erro: error.message });
  }
});

// =======================================================
// === ROTA DE LOGIN (POST /api/auth/login) ===
// =======================================================
router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ mensagem: 'Por favor, preencha todos os campos.' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(senha, user.senha_hash))) {
      return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
    }
    const payload = { id: user.id, nome_usuario: user.nome_usuario };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ mensagem: 'Login bem-sucedido!', token });
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro no servidor.', erro: error.message });
  }
});

// =======================================================
// === ROTAS PARA REDEFINIÇÃO DE SENHA ===
// =======================================================

// ROTA PARA SOLICITAR A REDEFINIÇÃO DE SENHA (1ª parte do fluxo)
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ mensagem: 'Nenhuma conta encontrada com este email.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const tokenExpiration = new Date(Date.now() + 3600000); // 1 hora

    await db.query(
      'UPDATE usuarios SET reset_token = ?, reset_token_expira = ? WHERE id = ?',
      [hashedToken, tokenExpiration, user.id]
    );

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'colasmoreira@gmail.com',
        pass: 'iwzldrkdapasznti'
      }
    });

    const resetLink = `http://localhost:4200/reset-password?token=${resetToken}`;

    // >>>>> NOVO TEMPLATE DE EMAIL ESTILIZADO <<<<<
    const emailHtml = `
      <body style="margin: 0; padding: 0; font-family: Poppins, sans-serif; background-color: #f4f4f4;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border-collapse: collapse; margin-top: 30px; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
          <tr>
            <td align="center" bgcolor="#12182B" style="padding: 40px 0 30px 0;">
              <img src="URL_PUBLICA_DA_SUA_LOGO.PNG" alt="Gastronauta Logo" width="90" style="display: block;" />
              <h1 style="color: #ffffff; font-size: 24px; margin-top: 20px;">GASTRONAUTA</h1>
            </td>
          </tr>
          <tr>
            <td bgcolor="#ffffff" style="padding: 40px 30px 40px 30px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #333333; font-size: 20px; font-weight: bold;">
                    Redefinição de Senha
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0 30px 0; color: #555555; font-size: 16px; line-height: 1.5;">
                    Olá ${user.nome_usuario},<br><br>
                    Recebemos uma solicitação para redefinir sua senha. Para criar uma nova, clique no botão abaixo. Este link é válido por 1 hora.
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${resetLink}" style="display: inline-block; padding: 12px 35px; background-color: #12182B; color: #ffffff; text-decoration: none; border-radius: 25px; font-weight: 500;">
                      Redefinir Senha
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px 0 0 0; color: #888888; font-size: 14px;">
                    Se você não solicitou esta alteração, pode ignorar este email.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td bgcolor="#12182B" style="padding: 20px 30px; text-align: center; color: #a0aec0; font-size: 12px;">
              &copy; ${new Date().getFullYear()} Gastronauta. Todos os direitos reservados.
            </td>
          </tr>
        </table>
      </body>
    `;

    await transporter.sendMail({
      to: user.email,
      from: 'Gastronauta <colasmoreira@gmail.com>',
      subject: 'Redefinição de Senha - Gastronauta',
      html: emailHtml // Usando o novo template estilizado
    });

    res.json({ mensagem: 'Um link de redefinição foi enviado para o seu email.' });
  } catch (error) {
    console.error('Erro em forgot-password:', error);
    res.status(500).json({ mensagem: 'Ocorreu um erro no servidor.' });
  }
});

// ROTA PARA EFETIVAMENTE REDEFINIR A SENHA (2ª parte do fluxo)
router.post('/reset-password', async (req, res) => {
  const { token, novaSenha } = req.body;
  if (!token || !novaSenha) {
    return res.status(400).json({ mensagem: 'Token e nova senha são obrigatórios.' });
  }
  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE reset_token = ? AND reset_token_expira > NOW()',
      [hashedToken]
    );
    const user = rows[0];
    if (!user) {
      return res.status(400).json({ mensagem: 'Token inválido ou expirado.' });
    }
    const newHashedPassword = await bcrypt.hash(novaSenha, 10);
    await db.query(
      'UPDATE usuarios SET senha_hash = ?, reset_token = NULL, reset_token_expira = NULL WHERE id = ?',
      [newHashedPassword, user.id]
    );
    res.json({ mensagem: 'Senha redefinida com sucesso!' });
  } catch (error) {
    console.error('Erro em reset-password:', error);
    res.status(500).json({ mensagem: 'Ocorreu um erro no servidor.' });
  }
});

module.exports = router;