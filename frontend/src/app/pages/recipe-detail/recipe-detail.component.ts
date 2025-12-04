import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { jwtDecode } from 'jwt-decode';
import { PopupComponent } from '../../shared/popup/popup.component';
import { RatingModalComponent } from '../../shared/rating-modal/rating-modal'; 
import { AuthService } from '../../services/auth.service';

const BACKEND_URL = 'http://localhost:3000';

@Component({
  selector: 'app-recipe-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PopupComponent, RatingModalComponent],
  templateUrl: './recipe-detail.component.html',
  styleUrls: ['./recipe-detail.component.css']
})
export class RecipeDetailComponent implements OnInit {

  @ViewChild('deleteConfirmPopup') deletePopup!: PopupComponent;
  @ViewChild('ratingModal') ratingModal!: RatingModalComponent;

  recipe: any = null;
  isLoading = true;
  error: string | null = null;
  fullImageUrl: string | null = null;
  isOwner = false;
  currentUserId: number | null = null;

  ratingValue: number = 0;
  reviewCount: number = 0;
  fullStars: number = 0;
  hasHalfStar: boolean = false;
  emptyStars: number = 5;

  backend = BACKEND_URL;
  comentarios: any[] = [];

  authorAvatarUrl = 'assets/canvo.png';

  profileData: any = {
    nome_usuario: 'Carregando...',
    nome_completo: '',
    bio: '',
    foto_perfil_url: 'assets/canvo.png'
  };

  isLiked: boolean = false;
  private recipeId!: number;

  private actionPending: 'delete' | 'delete-success' | 'edit-info' | 'comment-delete' | '' = '';
  private selectedCommentId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private recipeService: RecipeService,
    private authService: AuthService, 
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        this.currentUserId = decodedToken.id;
      } catch (e) { 
        console.error("Token inválido:", e); 
      }
    }

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.recipeId = +idParam;
      this.loadRecipeDetails();
      this.loadRecipeRatings();
    } else {
      this.error = 'ID da receita não fornecido na URL.';
      this.isLoading = false;
    }
  }

  loadRecipeDetails(): void {
    this.recipeService.buscarPorId(this.recipeId).subscribe({
      next: (data) => {
        this.recipe = data;

        this.authorAvatarUrl =
          this.recipeService.getFullImageUrl(data.foto_perfil_url || '') || 'assets/canvo.png';

        if (this.recipe.ingredientes) {
          this.recipe.ingredientsList = this.recipe.ingredientes
            .split('\n')
            .filter((item: string) => item.trim() !== '');
        }

        this.fullImageUrl = this.recipeService.getFullImageUrl(this.recipe.url_imagem);
        this.isOwner = this.currentUserId === this.recipe.usuario_id;
        this.isLiked = data.isLikedByMe === 1 || data.isLikedByMe === true;

        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Receita não encontrada ou erro ao carregar.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  loadRecipeRatings(): void {
    this.recipeService.buscarAvaliacoes(this.recipeId).subscribe({
      next: (data) => {
        this.ratingValue = parseFloat(data.stats.mediaNotas) || 0;
        this.reviewCount = data.stats.totalAvaliacoes || 0;
        this.calculateStars(this.ratingValue);

        this.comentarios = (data.comentarios || [])
          .filter((c: any) => c.comentario && c.comentario.trim() !== '')
          .map((c: any) => ({
            ...c,
            likes: c.likes || 0,
            dislikes: c.dislikes || 0,
            liked: false,
            disliked: false,
            showReplyBox: false,
            replyText: '',
            replies: []
          }));
      },
      error: (err) => { 
        console.error("Erro ao buscar avaliações:", err); 
      }
    });
  }

  calculateStars(rating: number): void {
    const cappedRating = Math.max(0, Math.min(5, rating)); 
    this.fullStars = Math.floor(cappedRating);
    this.hasHalfStar = cappedRating % 1 >= 0.5; 
    const calculatedEmpty = 5 - this.fullStars - (this.hasHalfStar ? 1 : 0);
    this.emptyStars = Math.max(0, calculatedEmpty); 
  }

  publicarAvaliacao(data: { nota: number, comentario: string }): void {
    this.recipeService.publicarAvaliacao(this.recipeId, data).subscribe({
      next: () => { 
        this.loadRecipeRatings(); 
      },
      error: (err) => {
        console.error("Erro ao publicar avaliação:", err);
        this.deletePopup?.show('Erro', err.error?.mensagem || 'Não foi possível publicar sua avaliação.');
      }
    });
  }

  excluirReceita(): void {
    this.actionPending = 'delete';
    this.deletePopup.show(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir a receita "${this.recipe.prato}" permanentemente?`,
      true
    );
  }

  // 🔥 SUPORTE PARA EXCLUIR COMENTÁRIO
  deleteComment(c: any): void {
    this.selectedCommentId = c.id;
    this.actionPending = 'comment-delete';

    this.deletePopup.show(
      'Excluir comentário?',
      `Deseja realmente excluir seu comentário?`,
      true
    );
  }

  // 🔥 POPUP CONFIRM
  onPopupConfirm(): void {

    if (this.actionPending === 'delete') {
      this.recipeService.excluir(this.recipe.id).subscribe({
        next: (res) => {
          this.actionPending = 'delete-success';
          this.deletePopup.show('Sucesso!', res.mensagem);
        },
        error: (err) => {
          this.actionPending = '';
          this.deletePopup.show('Erro!', err.error?.mensagem || 'Erro ao excluir receita.');
        }
      });
      return;
    }
    

    if (this.actionPending === 'delete-success') {
      this.router.navigate(['/dashboard']);
      this.actionPending = '';
      return;
    }

    // EXCLUIR COMENTÁRIO DE AVALIAÇÃO
    if (this.actionPending === 'comment-delete' && this.selectedCommentId !== null) {
      this.recipeService.excluirComentario(this.recipeId, this.selectedCommentId).subscribe({
        next: () => {
          this.comentarios = this.comentarios.filter(c => c.id !== this.selectedCommentId);
          this.selectedCommentId = null;
          this.actionPending = '';
        },
        error: (err) => {
          console.error("Erro ao excluir comentário:", err);
          this.deletePopup.show('Erro!', 'Não foi possível excluir o comentário.');
          this.actionPending = '';
        }
      });
    }
  }

  editarReceita(): void {
    this.router.navigate(['/editar-receita', this.recipeId]);
  }

  toggleLike(): void {
    this.isLiked = !this.isLiked;
    
    this.recipeService.likeReceita(this.recipeId).subscribe({
      next: (res) => { 
        this.isLiked = res.liked;
      },
      error: (err) => {
        this.isLiked = !this.isLiked;
        console.error('Erro ao processar curtida:', err);
      }
    });
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/placeholder.png';
  }

  goBack() {
    window.history.back();
  }

  formatarData(dataString: string): string {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  createStarsArray(nota: number): number[] {
    const value = Math.max(0, Math.min(5, Math.round(nota || 0)));
    return Array(value).fill(0);
  }

  toggleLikeComment(c: any): void {
    if (!c.liked) {
      c.liked = true;
      c.likes++;
      if (c.disliked) {
        c.disliked = false;
        c.dislikes--;
      }
    } else {
      c.liked = false;
      c.likes--;
    }
  }

  toggleDislikeComment(c: any): void {
    if (!c.disliked) {
      c.disliked = true;
      c.dislikes++;
      if (c.liked) {
        c.liked = false;
        c.likes--;
      }
    } else {
      c.disliked = false;
      c.dislikes--;
    }
  }

  toggleReplyBox(c: any): void {
    c.showReplyBox = !c.showReplyBox;
  }

  sendReply(c: any): void {
    const text = (c.replyText || '').trim();
    if (!text) return;

    if (!Array.isArray(c.replies)) {
      c.replies = [];
    }

    c.replies.push(text);
    c.replyText = '';
    c.showReplyBox = false;
  }
  onPopupCancel(): void {
  this.selectedCommentId = null;
  this.actionPending = '';
}

}
