import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { RecipeService } from '../../services/recipe.service';

@Component({
  selector: 'app-comment-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './comment-modal.component.html',
  styleUrls: ['./comment-modal.component.css']
})
export class CommentModalComponent {

  // visibilidade do modal
  isVisible = false;

  // dados do post
  recipeId: number | null = null;
  recipeImageUrl: string | null = null;
  authorAvatarUrl: string | null = null;
  authorName: string | null = null;

  // like/curtidas
  isLiked = false;
  totalLikes = 0;

  // comentários
  comments: any[] = [];
  isLoading = false;

  // form
  commentForm!: FormGroup;

  // scroll container
  @ViewChild('commentList') private commentListContainer!: ElementRef;

  constructor(
    private recipeService: RecipeService,
    private fb: FormBuilder
  ) {
    // ✅ inicializa o form no construtor (evita erro do this.fb.group na propriedade)
    this.commentForm = this.fb.group({
      newComment: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  /** Mostrar modal com dados do post */
  show(post: any) {
  this.recipeId = post.id;
  this.recipeImageUrl = this.recipeService.getFullImageUrl(post.url_imagem);
  this.authorAvatarUrl = this.recipeService.getFullImageUrl(post.foto_perfil_url);
  this.authorName = post.nome_usuario;
  this.isVisible = true;
  this.loadComments();
  document.body.style.overflow = 'hidden';
}

  /** Fechar modal */
  hide() {
    this.isVisible = false;
    this.comments = [];
    this.commentForm.reset();
    document.body.style.overflow = 'auto';
  }

  /** Buscar comentários */
  loadComments() {
    if (!this.recipeId) return;

    this.isLoading = true;
    this.recipeService.getComments(this.recipeId).subscribe({
      next: (res) => {
        this.comments = (res?.comments || []).map((c: any) => ({
          ...c,
          foto_perfil_url: this.recipeService.getFullImageUrl(c.foto_perfil_url)
        }));
        this.isLoading = false;
        // rola para o final
        setTimeout(() => {
          if (this.commentListContainer) {
            this.commentListContainer.nativeElement.scrollTop =
              this.commentListContainer.nativeElement.scrollHeight;
          }
        }, 50);
      },
      error: () => (this.isLoading = false)
    });
  }

  /** Like/Deslike */
  toggleLike() {
    if (!this.recipeId) return;
    this.recipeService.likeReceita(this.recipeId).subscribe(res => {
      this.isLiked = res.liked;
      this.totalLikes = res.totalCurtidas;
    });
  }

  /** Enviar comentário */
  postComment() {
    if (!this.recipeId || this.commentForm.invalid) return;

    const text = (this.commentForm.value.newComment || '').trim();
    if (!text) return;

    this.recipeService.postComment(this.recipeId, text).subscribe(res => {
      const novo = {
        ...res.comentario,
        foto_perfil_url: this.recipeService.getFullImageUrl(res.comentario.foto_perfil_url)
      };
      this.comments.push(novo);
      this.commentForm.reset();

      setTimeout(() => {
        if (this.commentListContainer) {
          this.commentListContainer.nativeElement.scrollTop =
            this.commentListContainer.nativeElement.scrollHeight;
        }
      }, 50);
    });
  }
}
