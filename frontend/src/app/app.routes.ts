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
import { EditarPerfilComponent } from './pages/editar-perfil/editar-perfil.component';
import { EditRecipeComponent } from './pages/edit-recipe/edit-recipe.component';
import { FollowersListComponent } from './auth/followers-list/followers-list.component';


import { UserPostsComponent } from './pages/dashboard/user-posts/user-posts.component';
import { LikedPostsComponent } from './pages/dashboard/liked-posts/liked-posts.component';

import { LayoutComponent } from './layout/layout.component';

export const routes: Routes = [

  // Páginas públicas
  { path: 'home', component: HomeComponent, canActivate: [publicGuard] },
  { path: 'login', component: LoginComponent, canActivate: [publicGuard] },
  { path: 'cadastro', component: RegisterComponent, canActivate: [publicGuard] },
  { path: 'esqueci-senha', component: EsqueciSenhaComponent, canActivate: [publicGuard] },
  { path: 'reset-password', component: RedefinirSenhaComponent, canActivate: [publicGuard] },

  // 🔥 TODAS AS PÁGINAS LOGADAS USAM O LAYOUT
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'feed', component: FeedComponent },
      { path: 'criar-receita', component: CriarReceitaComponent },
      { path: 'receita/:id', component: RecipeDetailComponent },
      { path: 'editar-receita/:id', component: EditRecipeComponent },
      { path: 'editar-perfil', component: EditarPerfilComponent },

      {
        path: 'dashboard',
        component: DashboardComponent,
        children: [
          { path: '', component: UserPostsComponent },
          { path: 'curtidas', component: LikedPostsComponent }
        ]
      },
       { path: 'followers/:id', component: FollowersListComponent },

      { path: '', redirectTo: '/feed', pathMatch: 'full' },

      { path: '', redirectTo: '/feed', pathMatch: 'full' }
    ]
  },

  // Redirecionamento padrão
  { path: '**', redirectTo: '/home' }
  
];
