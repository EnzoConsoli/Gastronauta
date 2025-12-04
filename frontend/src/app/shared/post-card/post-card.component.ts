import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';

type FeedPost = {
  id: number;
  usuario_id: number;
  nome_usuario: string;
  descricao?: string | null;
  prato?: string | null;
  url_imagem?: string | null;
  foto_perfil_url?: string | null;
  isLikedByMe?: boolean | number | null;
  totalCurtidas?: number | string | null;
  avgAval?: number | string | null;
  totalAval?: number | string | null;
};

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.css'],
})
export class PostCardComponent implements OnInit {
  @Input() post!: FeedPost;
  @Input() currentUserId: number | null = null;  // ✅ vem do feed

  isOwner = false;
  // backup, caso por algum motivo não venha o currentUserId
  loggedUserId = Number(localStorage.getItem('user_id'));

  isLiked = false;
  totalLikes = 0;
  avgAval = '0.0';
  totalAval = 0;

  postImageUrl = 'assets/placeholder.png';
  authorAvatarUrl = 'assets/canvo.png';

  constructor(private recipeService: RecipeService) {}

  ngOnInit(): void {
    const effectiveLoggedId =
      this.currentUserId != null ? this.currentUserId : this.loggedUserId;

    this.isOwner = effectiveLoggedId != null && this.post.usuario_id === effectiveLoggedId;

    this.isLiked = !!Number(this.post?.isLikedByMe ?? 0);
    this.totalLikes = Number(this.post?.totalCurtidas ?? 0);

    const avg = Number(this.post?.avgAval ?? 0);
    this.avgAval = avg.toFixed(1);

    this.totalAval = Number(this.post?.totalAval ?? 0);

    const img = this.recipeService.getFullImageUrl(this.post?.url_imagem ?? '') as string | null;
    this.postImageUrl = img || 'assets/placeholder.png';

    const avatar = this.recipeService.getFullImageUrl(this.post?.foto_perfil_url ?? '') as string | null;
    this.authorAvatarUrl = avatar || 'assets/canvo.png';
  }

  toggleLike(): void {
    if (!this.post?.id) return;
    this.recipeService.likeReceita(this.post.id).subscribe({
      next: (res) => {
        this.isLiked = !!res.liked;
        this.totalLikes = Number(res.totalCurtidas ?? 0);
      },
    });
  }

  onPostImageError(ev: Event): void {
    (ev.target as HTMLImageElement).src = 'assets/placeholder.png';
  }
  onAvatarError(ev: Event): void {
    (ev.target as HTMLImageElement).src = 'assets/canvo.png';
  }
}
