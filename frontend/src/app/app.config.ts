// src/app/app.config.ts

import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { routes } from './app.routes';
import { jwtInterceptor } from './auth/jwt-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // 🔥 AQUI ESTÁ A CORREÇÃO DEFINITIVA
    provideRouter(
      routes,
      withRouterConfig({ onSameUrlNavigation: 'reload' })
    ),

    provideHttpClient(withInterceptors([jwtInterceptor])),
    importProvidersFrom(FormsModule)
  ]
};
