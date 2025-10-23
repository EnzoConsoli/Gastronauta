import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { CommonModule } from '@angular/common';
import { jwtDecode } from 'jwt-decode';
import { PopupComponent } from '../../shared/popup/popup.component';
// 1. IMPORTAR O NOVO MODAL DE AVALIAÇÃO
import { RatingModalComponent } from '../../shared/rating-modal/rating-modal';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  // 2. ADICIONAR O MODAL AOS IMPORTS
  imports: [CommonModule, RouterLink, PopupComponent, RatingModalComponent],
  templateUrl: './recipe-detail.component.html',
  styleUrls: ['./recipe-detail.component.css']
})
export class RecipeDetailComponent implements OnInit {
  @ViewChild('deleteConfirmPopup') deletePopup!: PopupComponent;
  // 3. ADICIONAR A REFERÊNCIA DO NOVO MODAL
  @ViewChild('ratingModal') ratingModal!: RatingModalComponent;

  recipe: any = null;
  isLoading = true;
  error: string | null = null;
  fullImageUrl: string | null = null;
  isOwner = false;
  currentUserId: number | null = null;

  // 4. ADICIONAR AS VARIÁVEIS PARA AS AVALIAÇÕES
  ratingValue: number = 0;
  reviewCount: number = 0;
  fullStars: number = 0;
  hasHalfStar: boolean = false;
  emptyStars: number = 5;

  private recipeId!: number; // Para guardar o ID da receita

  constructor(
    private route: ActivatedRoute,
    private recipeService: RecipeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        this.currentUserId = decodedToken.id;
      } catch (e) { console.error("Token inválido:", e); }
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.recipeId = +idParam; // Converte string para número e armazena
      this.loadRecipeDetails(); // Carrega os detalhes
      this.loadRecipeRatings(); // Carrega as avaliações
    } else {
      this.error = 'ID da receita não fornecido na URL.';
      this.isLoading = false;
    }
  }

  // 5. ATUALIZAR A FUNÇÃO DE CARREGAR DETALHES
  loadRecipeDetails(): void {
    this.recipeService.buscarPorId(this.recipeId).subscribe({
      next: (data) => {
        this.recipe = data;
        if (this.recipe.ingredientes) {
          this.recipe.ingredientsList = this.recipe.ingredientes.split('\n').filter((item: string) => item.trim() !== '');
        }
        this.fullImageUrl = this.recipe.url_imagem ? `http://localhost:3000${this.recipe.url_imagem}` : 'assets/placeholder.png';
        this.isOwner = this.currentUserId === this.recipe.usuario_id;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Receita não encontrada ou erro ao carregar.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  // 6. ADICIONAR A FUNÇÃO PARA CARREGAR AVALIAÇÕES
  loadRecipeRatings(): void {
    this.recipeService.buscarAvaliacoes(this.recipeId).subscribe({
      next: (data) => {
        this.ratingValue = parseFloat(data.stats.mediaNotas) || 0;
        this.reviewCount = data.stats.totalAvaliacoes || 0;
        this.calculateStars(this.ratingValue);
      },
      error: (err) => {
        console.error("Erro ao buscar avaliações:", err);
      }
    });
  }

  // 7. ADICIONAR A FUNÇÃO PARA CALCULAR ESTRELAS
  calculateStars(rating: number): void {
    const cappedRating = Math.max(0, Math.min(5, rating));
    this.fullStars = Math.floor(cappedRating);
    this.hasHalfStar = cappedRating % 1 >= 0.5;
    const calculatedEmpty = 5 - this.fullStars - (this.hasHalfStar ? 1 : 0);
    this.emptyStars = Math.max(0, calculatedEmpty);
  }

  // 8. ADICIONAR A FUNÇÃO PARA PUBLICAR A AVALIAÇÃO
  publicarAvaliacao(data: { nota: number, comentario: string }): void {
    this.recipeService.publicarAvaliacao(this.recipeId, data).subscribe({
      next: () => {
        // Sucesso! Recarrega as avaliações para mostrar a nova média
        this.loadRecipeRatings();
      },
      error: (err) => {
        console.error("Erro ao publicar avaliação:", err);
        // Reutiliza o popup de exclusão para mostrar o erro
        this.deletePopup.show('Erro', err.error?.mensagem || 'Não foi possível publicar sua avaliação.');
      }
    });
  }

  // --- Funções que você já tinha ---
  onImageError(event: Event): void {
    const element = event.target as HTMLImageElement;
    const fallbackSrc = 'assets/placeholder.png';
    if (!element.src.endsWith(fallbackSrc)) {
      element.src = fallbackSrc;
    }
  }

  excluirReceita(): void {
    this.deletePopup.show(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir a receita "${this.recipe.prato}" permanentemente?`
    );
  }

  confirmarExclusao(): void {
    if (!this.recipe) return;
    this.recipeService.excluir(this.recipe.id).subscribe({
      next: (res) => {
        alert(res.mensagem);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        alert(err.error?.mensagem || 'Erro ao excluir receita.');
      }
    });
  }

  editarReceita(): void {
    this.router.navigate(['/criar-receita'], { queryParams: { edit: this.recipe.id } });
    alert('Funcionalidade de Edição ainda não implementada.');
  }
}