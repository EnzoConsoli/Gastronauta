import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  ActivatedRoute
} from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { AuthService } from '../../services/auth.service';
import { PopupComponent } from '../../shared/popup/popup.component';
import { UserProfile } from '../../models/user-profile.model';

const BACKEND_URL = 'http://localhost:3000';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, PopupComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  profileData: UserProfile = {
    id: 0,
    nome_usuario: 'Carregando...',
    nome_completo: '',
    bio: '',
    foto_perfil_url: 'assets/canvo.png'
  };

  loggedUserId = 0;
  myRecipesCount = 0;
  isMyProfile = true;

  // FOLLOW SYSTEM
  isFollowing = false;
  followersCount = 0;
  followingCount = 0;

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
    public router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {

    this.loggedUserId = Number(localStorage.getItem('user_id'));

    this.route.queryParams.subscribe(params => {
      const userParam = params['user'];

      if (!userParam || Number(userParam) === this.loggedUserId) {
        this.carregarMeuPerfil();
      } else {
        this.carregarPerfilVisitado(Number(userParam));
      }
    });
  }

  // PERFIL DO USUÁRIO LOGADO
  carregarMeuPerfil() {
    this.isMyProfile = true;

    this.authService.getProfile().subscribe({
      next: (data) => {
        this.profileData = {
          ...data,
          foto_perfil_url: data.foto_perfil_url
            ? `${BACKEND_URL}${data.foto_perfil_url}`
            : 'assets/canvo.png'
        };
      }
    });

    this.recipeService.buscarMinhasReceitas().subscribe({
      next: lista => this.myRecipesCount = lista.length
    });

    this.recipeService.getFollowingCount(this.loggedUserId).subscribe({
      next: data => this.followingCount = data.total
    });

    this.recipeService.getFollowersCount(this.loggedUserId).subscribe({
      next: data => this.followersCount = data.total
    });

    this.isFollowing = false;
  }

  // PERFIL DE OUTRA PESSOA
  carregarPerfilVisitado(targetUserId: number) {
    this.isMyProfile = false;

    this.recipeService.getProfileById(targetUserId).subscribe({
      next: (data) => {
        this.profileData = {
          ...data,
          foto_perfil_url: data.foto_perfil_url
            ? `${BACKEND_URL}${data.foto_perfil_url}`
            : 'assets/canvo.png'
        };
      }
    });

    this.recipeService.buscarReceitasDeUsuario(targetUserId).subscribe({
      next: lista => this.myRecipesCount = lista.length
    });

    this.recipeService.getFollowersCount(targetUserId).subscribe({
      next: data => this.followersCount = data.total
    });

    this.recipeService.getFollowingCount(targetUserId).subscribe({
      next: data => this.followingCount = data.total
    });

    // 🔥 AQUI ELE CONFERE NO BACKEND SE JÁ ESTÁ SEGUINDO
    this.recipeService.isFollowing(targetUserId).subscribe({
      next: data => this.isFollowing = data.seguindo
    });
  }

  // BOTÃO SEGUIR / DEIXAR DE SEGUIR
  toggleFollow() {
    const seguidoId = this.profileData.id;

    if (!this.isFollowing) {
      this.recipeService.followUser(seguidoId).subscribe(() => {
        this.isFollowing = true;
        this.followersCount++;
      });
    } else {
      this.recipeService.unfollowUser(seguidoId).subscribe(() => {
        this.isFollowing = false;
        this.followersCount--;
      });
    }
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/home']);
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/canvo.png';
  }

  openFollowers() {
    this.router.navigate(['/followers', this.profileData.id], {
      queryParams: { type: 'followers' }
    });
  }

  openFollowing() {
    this.router.navigate(['/followers', this.profileData.id], {
      queryParams: { type: 'following' }
    });
  }
}
