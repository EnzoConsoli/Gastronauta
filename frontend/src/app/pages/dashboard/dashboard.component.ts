import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
// Importe tudo necessário para as rotas filhas
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; 
import { jwtDecode } from 'jwt-decode';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  // Garanta que RouterOutlet, RouterLink, RouterLinkActive estão aqui
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive], 
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  username: string | null = null;
  myRecipesCount = 0; // Apenas a contagem
  fullName = '';
  bio = 'Amante de culinária e explorador de sabores!';

  constructor(private recipeService: RecipeService, private router: Router) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        this.username = decodedToken.nome_usuario;
        this.fullName = decodedToken.nome_usuario;
      } catch (error) {
        console.error("Erro ao decodificar o token:", error);
        this.logout();
      }
    }

    // Busca as receitas apenas para CONTAR
    this.recipeService.buscarMinhasReceitas().subscribe(data => {
      this.myRecipesCount = data.length;
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/home']);
  }
}