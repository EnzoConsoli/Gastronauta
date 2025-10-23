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
        localStorage.setItem('token', response.token); // Salva o token para manter o usuário logado
        this.router.navigate(['/dashboard']); // Redireciona para a página protegida
      },
      error: (err) => {
        // Mostra a mensagem de erro vinda do backend ou uma mensagem padrão
        this.errorMessage = err.error?.mensagem || 'Credenciais inválidas. Tente novamente.';
      }
    });
  }
}