// src/app/app.config.ts

import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
// 👇 Importe 'withInterceptors' AQUI 👇
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { routes } from './app.routes';
// 👇 Importe seu interceptor AQUI 👇
import { jwtInterceptor } from './auth/jwt-interceptor'; 

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // 👇 ATUALIZE ESTA LINHA para incluir 'withInterceptors' 👇
    provideHttpClient(withInterceptors([jwtInterceptor])),
    importProvidersFrom(FormsModule)
  ]
};