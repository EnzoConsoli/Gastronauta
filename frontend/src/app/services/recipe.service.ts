import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserProfile } from '../models/user-profile.model';

const BACKEND_URL = 'http://localhost:3000';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {

  private apiUrl = `${BACKEND_URL}/api/receitas`;

  constructor(private http: HttpClient) {}

  // ================================
  // 🔥 IMAGENS E PERFIS
  // ================================
  getFullImageUrl(relativePath: string | null): string | null {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;

    if (relativePath.startsWith('/api/users/avatars/')) {
      return `${BACKEND_URL}${relativePath}`;
    }

    if (relativePath.startsWith('/uploads/')) {
      return `${BACKEND_URL}${relativePath}`;
    }

    return null;
  }

  getProfileById(userId: number): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${BACKEND_URL}/api/users/${userId}`);
  }

  // ================================
  // 🔍 BUSCA DE RECEITAS (INSTAGRAM)
  // ================================
  buscarReceitasPesquisa(query: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/search`,
      { params: { q: query } }
    );
  }

  // ================================
  // 🔥 FEED / RECEITAS
  // ================================
  getFeed(): Observable<any> {
    return this.http.get(`${this.apiUrl}/feed`);
  }

  buscarPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  buscarMinhasReceitas(): Observable<any[]> { 
    return this.http.get<any[]>(`${this.apiUrl}/my-recipes`);
  }

  buscarCurtidas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/liked`);
  }

  criar(recipeData: FormData): Observable<any> {
    return this.http.post(this.apiUrl, recipeData);
  }

  atualizar(id: number, recipeData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, recipeData);
  }
  
  excluir(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  likeReceita(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/like`, {});
  }

  getLikeStatus(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/like-status`);
  }

  getComments(id: number, page: number = 1, limit: number = 20): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<any>(`${this.apiUrl}/${id}/comments`, { params });
  }

  postComment(id: number, comentario: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/comment`, { comentario });
  }

  buscarAvaliacoes(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/avaliacoes`);
  }

  publicarAvaliacao(id: number, data: { nota: number, comentario: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/avaliar`, data);
  }

  buscarReceitasDeUsuario(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`);
  }

  // ================================
  // 🔥 SEGUIR / DEIXAR DE SEGUIR
  // ================================
  followUser(seguidoId: number) {
    return this.http.post(
      `${BACKEND_URL}/api/users/seguir`,
      { seguido_id: seguidoId }
    );
  }

  unfollowUser(seguidoId: number) {
    return this.http.request(
      'delete',
      `${BACKEND_URL}/api/users/seguir`,
      { body: { seguido_id: seguidoId } }
    );
  }

  // 🔴 AQUI É O MAIS IMPORTANTE: BATER NA ROTA /:id/is-following
  isFollowing(seguidoId: number) {
    return this.http.get<any>(`${BACKEND_URL}/api/users/${seguidoId}/is-following`);
  }

  getFollowersCount(userId: number) {
    return this.http.get<any>(`${BACKEND_URL}/api/users/${userId}/followers`);
  }

  getFollowingCount(userId: number) {
    return this.http.get<any>(`${BACKEND_URL}/api/users/${userId}/following`);
  }

  getFollowers(userId: number) {
    return this.http.get<any[]>(`${BACKEND_URL}/api/users/${userId}/followers-list`);
  }

  getFollowing(userId: number) {
    return this.http.get<any[]>(`${BACKEND_URL}/api/users/${userId}/following-list`);
  }

  // ================================
  // ❗ EXCLUIR COMENTÁRIO
  // ================================
  excluirComentario(receitaId: number, commentId: number) {
    return this.http.delete(`${this.apiUrl}/${receitaId}/comment/${commentId}`);
  }

}
