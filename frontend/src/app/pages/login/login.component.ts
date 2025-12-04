import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']  
})
export class LoginComponent {
  credentials = {
    email: '',
    senha: ''
  };

  showPassword = false;
  errorMessage: string | null = null; 

  constructor(private authService: AuthService, private router: Router) { }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    this.errorMessage = null;

    if (!this.credentials.email || !this.credentials.senha) {
      this.errorMessage = 'Por favor, preencha todos os campos.';
      return;
    }

    this.authService.login(this.credentials).subscribe({
      next: (response) => {

        console.log('Login bem-sucedido, token recebido:', response.token);
        
        // 🔥 Salva o token
        localStorage.setItem('token', response.token);

        // 🔥 Salva o ID do usuário (correção DEFINITIVA)
        localStorage.setItem('user_id', String(response.id));

        // 🔥 Salva também o nome de usuário (opcional mas recomendado)
        if (response.nome_usuario) {
          localStorage.setItem('username', response.nome_usuario);
        }

        // Navega para o feed
        this.router.navigate(['/feed']);
      },

      error: (err) => {
        this.errorMessage = err.error?.mensagem || 'Credenciais inválidas. Tente novamente.';
      }
    });
  }
}
