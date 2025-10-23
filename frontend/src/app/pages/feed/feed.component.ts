import { Component, OnInit } from '@angular/core';
import { RecipeService } from '../../services/recipe.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router'; // <<< PASSO 1: IMPORTE O RouterLink AQUI

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, RouterLink], // <<< PASSO 2: ADICIONE O RouterLink AOS IMPORTS
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.css']
})
export class FeedComponent implements OnInit {
  recipes: any[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private recipeService: RecipeService) {}

  ngOnInit(): void {
    this.recipeService.buscarTodas().subscribe({
      next: (data) => {
        this.recipes = data;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Não foi possível carregar as receitas. Tente novamente mais tarde.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/placeholder.png';
  }
}