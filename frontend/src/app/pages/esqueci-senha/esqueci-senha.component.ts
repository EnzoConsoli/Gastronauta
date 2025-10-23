import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule, NgModel } from '@angular/forms'; // <-- Importe NgModel
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-esqueci-senha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './esqueci-senha.component.html',
  styleUrls: ['./esqueci-senha.component.css']
})
export class EsqueciSenhaComponent {
  email: string = '';
  message: string = '';
  loading: boolean = false;
  isError: boolean = false;
  showRegisterLink: boolean = false;

  constructor(private authService: AuthService) { }

  // A função agora recebe o estado do campo de email
  onSubmit(emailField: NgModel): void {
    // Reseta as mensagens a cada nova tentativa
    this.loading = true;
    this.message = '';
    this.isError = false;
    this.showRegisterLink = false;

    // 1. Validação de CAMPO VAZIO (quando clica no botão)
    if (!this.email) {
      this.message = 'Por favor, preencha o campo de email.';
      this.isError = true;
      this.loading = false;
      return;
    }

    // 2. Validação de FORMATO DE EMAIL INVÁLIDO (quando clica no botão)
    if (emailField.errors?.['email']) {
      this.message = 'Por favor, insira um formato de email válido.';
      this.isError = true;
      this.loading = false;
      return;
    }

    // 3. Se tudo estiver certo, chama a API
    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.message = res.mensagem;
        this.isError = false;
        this.loading = false;
      },
      error: (err) => {
        this.message = err.error.mensagem;
        this.isError = true;
        
        if (err.status === 404) {
          this.showRegisterLink = true;
        }

        this.loading = false;
      }
    });
  }
}