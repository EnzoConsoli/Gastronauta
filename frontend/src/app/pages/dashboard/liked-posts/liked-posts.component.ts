import { Component, OnInit } from '@angular/core';
import { RecipeService } from '../../../services/recipe.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-liked-posts',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="recipes-grid">
      <a *ngFor="let recipe of likedRecipes" [routerLink]="['/receita', recipe.id]" class="recipe-item">
        <img [src]="recipe.fullImageUrl" alt="{{ recipe.prato }}" (error)="onImageError($event)">
      </a>
      <div *ngIf="likedRecipes.length === 0 && !isLoading" class="no-posts">
        <p>Você ainda não curtiu nenhuma receita.</p>
      </div>
    </div>
  `,
  styles: [`
    .recipes-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 28px; padding: 20px 0; }
    .recipe-item { position: relative; cursor: pointer; aspect-ratio: 1 / 1; display: block; overflow:hidden; border-radius: 4px; background-color: #3e4c63;}
    .recipe-item img { position: absolute; width: 100%; height: 100%; object-fit: cover; transition: transform .2s ease-in-out;}
    .recipe-item:hover img { transform: scale(1.05); }
    .no-posts { grid-column: 1 / -1; text-align: center; color: #a0aec0; padding: 40px 0; font-size: 1.2rem; }
  `]
})
export class LikedPostsComponent implements OnInit {
  likedRecipes: any[] = [];
  isLoading = true;

  constructor(private recipeService: RecipeService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.recipeService.buscarCurtidas().subscribe({
      next: (data) => {
        this.likedRecipes = data.map(recipe => ({
          ...recipe,
          fullImageUrl: this.recipeService.getFullImageUrl(recipe.url_imagem)
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Erro ao buscar receitas curtidas:", err);
        this.isLoading = false;
      }
    });
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/placeholder.png';
  }
}