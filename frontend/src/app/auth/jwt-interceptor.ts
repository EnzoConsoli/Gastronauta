// src/app/auth/jwt.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  // 1. Pega o token que foi salvo no localStorage durante o login
  const token = localStorage.getItem('token');

  // 2. Verifica se o token existe
  if (token) {
    // 3. Se existir, clona a requisição original...
    req = req.clone({
      // ...e adiciona um novo cabeçalho chamado 'Authorization'
      setHeaders: {
        // O valor do cabeçalho é "Bearer " seguido pelo token
        Authorization: `Bearer ${token}`
      }
    });
  }

  // 4. Envia a requisição (original ou a clonada com o token) para o próximo passo
  return next(req);
};