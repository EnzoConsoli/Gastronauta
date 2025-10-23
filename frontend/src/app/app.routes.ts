import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './auth/auth.guard';
import { publicGuard } from './auth/auth.public.guard';
import { EsqueciSenhaComponent } from './pages/esqueci-senha/esqueci-senha.component';
import { RedefinirSenhaComponent } from './pages/redefinir-senha/redefinir-senha.component';
import { FeedComponent } from './pages/feed/feed.component';
import { CriarReceitaComponent } from './pages/criar-receita/criar-receita.component';
import { RecipeDetailComponent } from './pages/recipe-detail/recipe-detail.component';

// Importa os componentes das abas
import { UserPostsComponent } from './pages/dashboard/user-posts/user-posts.component';
import { LikedPostsComponent } from './pages/dashboard/liked-posts/liked-posts.component';

export const routes: Routes = [
  // Rotas Públicas
  { path: 'home', component: HomeComponent, canActivate: [publicGuard] },
  { path: 'login', component: LoginComponent, canActivate: [publicGuard] },
  { path: 'cadastro', component: RegisterComponent, canActivate: [publicGuard] },
  { path: 'esqueci-senha', component: EsqueciSenhaComponent, canActivate: [publicGuard] },
  { path: 'reset-password', component: RedefinirSenhaComponent, canActivate: [publicGuard] },
  
  // Rotas Protegidas Principais
  { path: 'criar-receita', component: CriarReceitaComponent, canActivate: [authGuard] },
  { path: 'feed', component: FeedComponent, canActivate: [authGuard] },
  { path: 'receita/:id', component: RecipeDetailComponent, canActivate: [authGuard] },

  // ROTA MÃE: O Dashboard agora é um "container" com rotas filhas
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [authGuard],
    children: [
      { path: '', component: UserPostsComponent }, // Aba "Postagens" (padrão)
      { path: 'curtidas', component: LikedPostsComponent } // Aba "Curtidas"
    ]
  },

  // Redirecionamentos
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];