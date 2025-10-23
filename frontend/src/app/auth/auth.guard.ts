// src/app/auth/auth.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token'); // Procura pelo token no armazenamento do navegador

  if (token) {
    return true; // Se o token existe, permite o acesso à rota
  } else {
    // Se não existe token, redireciona para a página de login
    router.navigate(['/login']);
    return false; // Bloqueia o acesso à rota atual
  }
};