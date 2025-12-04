import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent {

  query: string = '';
  resultados: any[] = [];
  carregando = false;
  jaBuscou = false; // <<< IMPORTANTE

  constructor(
    private recipeService: RecipeService,
    private router: Router
  ) {}

  onSearch() {
    const q = this.query.trim();

    // Digitou pouco → não faz nada
    if (q.length < 2) {
      this.resultados = [];
      this.jaBuscou = false;
      return;
    }

    this.carregando = true;

    this.recipeService.buscarReceitasPesquisa(q).subscribe({
      next: (data) => {
        this.jaBuscou = true;       // <<< agora sabemos que terminou a busca
        this.resultados = data;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
        this.jaBuscou = true;
      }
    });
  }

  abrirReceita(id: number) {
    this.router.navigate([`/receita/${id}`]);
  }

  limpar() {
    this.query = '';
    this.resultados = [];
    this.jaBuscou = false;
  }
}
