import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const BACKEND_URL = 'http://localhost:3000';

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private apiUrl = `${BACKEND_URL}/api/receitas`;
  constructor(private http: HttpClient) { }

  criar(recipeData: FormData): Observable<any> { return this.http.post(this.apiUrl, recipeData); }
  buscarTodas(): Observable<any[]> { return this.http.get<any[]>(this.apiUrl); }
  buscarMinhasReceitas(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/my-recipes`); }
  buscarCurtidas(): Observable<any[]> { return this.http.get<any[]>(`${this.apiUrl}/liked`); }
  buscarPorId(id: number): Observable<any> { return this.http.get<any>(`${this.apiUrl}/${id}`); }
  excluir(id: number): Observable<any> { return this.http.delete(`${this.apiUrl}/${id}`); }
  atualizar(id: number, recipeData: any): Observable<any> { return this.http.put(`${this.apiUrl}/${id}`, recipeData); }

  getFullImageUrl(relativePath: string | null): string {
    if (relativePath && relativePath.startsWith('/uploads/')) {
      return `${BACKEND_URL}${relativePath}`;
    }
    return 'assets/placeholder.png'; 
  }
  buscarAvaliacoes(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/avaliacoes`);
  }

  publicarAvaliacao(id: number, data: { nota: number, comentario: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/avaliar`, data);
  }
}