// src/app/auth/public.guard.ts

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const publicGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  if (token) {
    // Se o token EXISTE (usuário está logado), bloqueia o acesso
    // e redireciona para o dashboard.
    router.navigate(['/dashboard']);
    return false;
  } else {
    // Se NÃO existe token (usuário não está logado), permite o acesso.
    return true;
  }
};