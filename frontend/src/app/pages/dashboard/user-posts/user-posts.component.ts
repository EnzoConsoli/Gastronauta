import { Component, OnInit } from '@angular/core';
import { RecipeService } from '../../../services/recipe.service';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-user-posts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="recipes-grid">
      <div *ngFor="let recipe of myRecipes" class="recipe-card">
        <a [routerLink]="['/receita', recipe.id]" class="recipe-link">
          <div class="recipe-image-container">
            <img [src]="recipe.fullImageUrl" alt="{{ recipe.prato }}" (error)="onImageError($event)">
          </div>
          <div class="recipe-card-content">
            <h3 class="recipe-card-title">{{ recipe.prato }}</h3>
            <p class="recipe-author">Por: @{{ recipe.nome_usuario }}</p>
          </div>
        </a>
        <div class="recipe-card-footer">
          <div class="recipe-card-rating">
            <div class="stars">
              <ng-container *ngFor="let i of [].constructor(recipe.fullStars)"><i class="fa-solid fa-star"></i></ng-container>
              <i *ngIf="recipe.hasHalfStar" class="fa-solid fa-star-half-stroke"></i>
              <ng-container *ngFor="let i of [].constructor(recipe.emptyStars)"><i class="fa-regular fa-star empty-star"></i></ng-container>
            </div>
            <span>({{ recipe.totalAvaliacoes }})</span>
          </div>
          <i class="like-icon"
             [ngClass]="recipe.isLikedByMe ? 'fa-solid fa-heart liked' : 'fa-regular fa-heart'"
             (click)="toggleLikeOnCard(recipe, $event)">
          </i>
        </div>
      </div>
      <div *ngIf="myRecipes.length === 0 && !isLoading" class="no-posts">
        <p>Nenhuma receita publicada ainda.</p>
      </div>
    </div>
  `,
  styles: [`
    .recipes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 28px; padding: 20px 0; }
    .recipe-card { display: flex; flex-direction: column; text-decoration: none; background-color: #1a233a; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transition: transform 0.2s, box-shadow 0.2s; }
    .recipe-card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0,0,0,0.4); }
    .recipe-link { text-decoration: none; }
    .recipe-image-container { width: 100%; aspect-ratio: 16 / 9; background-color: #3e4c63; overflow: hidden; }
    .recipe-image-container img { width: 100%; height: 100%; object-fit: cover; }
    .recipe-card-content { padding: 15px 15px 0 15px; }
    .recipe-card-title { font-size: 1.2rem; font-weight: 700; color: #FFFFFF; margin: 0 0 10px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .recipe-author { font-size: 0.9rem; color: #a0aec0; margin: -5px 0 10px 0; }
    .recipe-card-footer { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px 15px 15px; }
    .recipe-card-rating { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #a0aec0; }
    .recipe-card-rating .stars { color: #ffc107; }
    .recipe-card-rating .stars i { font-size: 0.9rem; }
    .recipe-card-rating .stars .empty-star { color: #3e4c63; }
    .like-icon { font-size: 1.5rem; color: #a0aec0; cursor: pointer; transition: color 0.2s, transform 0.2s; }
    .like-icon:hover { transform: scale(1.1); }
    .like-icon.liked { color: #ed4956; }
    .no-posts { grid-column: 1 / -1; text-align: center; color: #a0aec0; padding: 40px 0; font-size: 1.2rem; }
  `]
})
export class UserPostsComponent implements OnInit {
  myRecipes: any[] = [];
  isLoading = true;

  constructor(
    private recipeService: RecipeService,
    private route: ActivatedRoute       // ✅ pra ler ?user= do dashboard
  ) {}

  ngOnInit(): void {
    this.isLoading = true;

    const loggedUserIdRaw = localStorage.getItem('user_id');
    const loggedUserId = loggedUserIdRaw ? Number(loggedUserIdRaw) : null;

    const userParam = this.route.parent?.snapshot.queryParams['user'];
    let isMyProfile = false;
    let targetUserId: number | null = null;

    if (!userParam || (loggedUserId !== null && Number(userParam) === loggedUserId)) {
      isMyProfile = true;
    } else {
      targetUserId = Number(userParam);
    }

    const receitas$ = isMyProfile || !targetUserId
      ? this.recipeService.buscarMinhasReceitas()
      : this.recipeService.buscarReceitasDeUsuario(targetUserId);

    receitas$.subscribe({
      next: (recipes) => {
        this.recipeService.buscarCurtidas().subscribe({
          next: (liked) => {
            const likedIds = new Set(liked.map((r: any) => r.id));

            this.myRecipes = recipes.map((recipe: any) => {
              const processed = this.processRecipeData(recipe);
              processed.isLikedByMe = likedIds.has(recipe.id);
              return processed;
            });

            this.isLoading = false;
          },
          error: () => { this.isLoading = false; }
        });
      },
      error: () => { this.isLoading = false; }
    });
  }

  processRecipeData(recipe: any): any {
    const rating = parseFloat(recipe.mediaNotas) || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0));

    return {
      ...recipe,
      fullImageUrl: this.recipeService.getFullImageUrl(recipe.url_imagem),
      fullStars, hasHalfStar, emptyStars,
      totalAvaliacoes: recipe.totalAvaliacoes || 0,
      isLikedByMe: recipe.isLikedByMe > 0
    };
  }

  onImageError(event: Event): void {
    const element = event.target as HTMLImageElement;
    const fallbackSrc = 'assets/placeholder.png';
    if (element.src && !element.src.includes(fallbackSrc)) {
      element.src = fallbackSrc;
    }
  }

  toggleLikeOnCard(recipe: any, event: MouseEvent): void {
    event.stopPropagation(); event.preventDefault();
    recipe.isLikedByMe = !recipe.isLikedByMe;
    this.recipeService.likeReceita(recipe.id).subscribe({
      next: (res) => { recipe.isLikedByMe = res.liked; },
      error: (err) => {
        recipe.isLikedByMe = !recipe.isLikedByMe;
        console.error("Erro ao curtir no card:", err);
        alert("Não foi possível processar sua curtida.");
      }
    });
  }
}
