// middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
require('dotenv').config();

function authMiddleware(req, res, next) {
  // 1. Pega o token do cabeçalho da requisição
  const authHeader = req.headers.authorization;

  // 2. Verifica se o token foi enviado no formato correto ("Bearer token...")
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ mensagem: 'Acesso negado. Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 3. Tenta verificar se o token é válido usando a chave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 4. Se for válido, adiciona os dados do usuário (ID, nome) à requisição
    req.user = decoded; 
    
    // 5. Permite que a requisição continue para a rota final (ex: criar receita)
    next(); 
  } catch (error) {
    // Se o token for inválido, retorna um erro
    res.status(401).json({ mensagem: 'Token inválido.' });
  }
}

module.exports = authMiddleware;