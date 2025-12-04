import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { RecipeService } from '../../services/recipe.service';
import { PostCardComponent } from '../../shared/post-card/post-card.component';
import { CommentModalComponent } from '../../shared/comment-modal/comment-modal.component';
import { AuthService } from '../../services/auth.service';

const BACKEND_URL = 'http://localhost:3000';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, RouterLink, PostCardComponent, CommentModalComponent],
  templateUrl: './feed.component.html',
  styleUrls: ['./feed.component.css']
})
export class FeedComponent implements OnInit {
  posts: any[] = [];
  page = 1;
  hasMore = true;
  isLoading = false;

  avatarUrl: string = 'assets/canvo.png';
  currentUserId: number | null = null;

  @ViewChild('commentModal') commentModal!: CommentModalComponent;

  constructor(
    private recipeService: RecipeService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMore();

    this.authService.getProfile().subscribe({
      next: (user) => {
        if (user) {
          this.currentUserId = user.id ?? null;
        }

        if (user?.foto_perfil_url) {
          this.avatarUrl = `${BACKEND_URL}${user.foto_perfil_url}`;
        }
      },
      error: () => {
        this.avatarUrl = 'assets/canvo.png';
      }
    });
  }

  loadMore() {
    this.isLoading = true;

    this.recipeService.getFeed().subscribe({
      next: (res: any) => {
        this.posts = res.receitas || res || [];
        this.hasMore = res.hasMore;
        this.isLoading = false;
      },
      error: () => (this.isLoading = false)
    });
  }

  openComments(post: any) {
    this.commentModal.show(post);
  }

  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
