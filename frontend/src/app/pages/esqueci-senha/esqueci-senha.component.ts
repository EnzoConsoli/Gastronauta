import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule, NgModel } from '@angular/forms';
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

  // ETAPA ATUAL
  etapa = 1;

  // Campos
  email = '';
  codigo = '';
  novaSenha = '';

  // Estado
  message = '';
  loading = false;
  isError = false;
  showRegisterLink = false;

  constructor(private authService: AuthService) {}

  // ===========================
  // ETAPA 1 — Enviar email
  // ===========================
  onEnviarEmail(emailField: NgModel) {
    this.resetMensagens();
    
    if (!this.email) {
      this.setErro('Por favor, preencha o email.');
      return;
    }
    if (emailField.errors?.['email']) {
      this.setErro('Email inválido.');
      return;
    }

    this.loading = true;

    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.message = 'Código enviado! Verifique seu email.';
        this.etapa = 2; // vai para ETAPA DO CÓDIGO
        this.loading = false;
      },
      error: (err) => {
        this.setErro(err.error.mensagem || 'Erro ao enviar código.');
        if (err.status === 404) this.showRegisterLink = true;
      }
    });
  }

  // ===========================
  // ETAPA 2 — Verificar código
  // ===========================
  onVerificarCodigo() {
    this.resetMensagens();

    if (!this.codigo || this.codigo.length !== 6) {
      this.setErro('O código deve ter 6 dígitos.');
      return;
    }

    this.loading = true;

    this.authService.verifyResetCode(this.email, this.codigo).subscribe({
      next: () => {
        this.message = 'Código verificado!';
        this.etapa = 3; // vai para ETAPA DA NOVA SENHA
        this.loading = false;
      },
      error: (err) => {
        this.setErro(err.error.mensagem || 'Código inválido.');
      }
    });
  }

  // ===========================
  // ETAPA 3 — Definir nova senha
  // ===========================
  onRedefinirSenha() {
    this.resetMensagens();

    if (!this.novaSenha || this.novaSenha.length < 6) {
      this.setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    this.loading = true;

    this.authService.resetPassword(this.email, this.codigo, this.novaSenha).subscribe({
      next: () => {
        this.message = 'Senha redefinida com sucesso!';
        this.isError = false;
        this.loading = false;

        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      },
      error: (err) => {
        this.setErro(err.error.mensagem || 'Erro ao redefinir senha.');
      }
    });
  }

  // ===========================
  // Funções auxiliares
  // ===========================
  setErro(msg: string) {
    this.message = msg;
    this.isError = true;
    this.loading = false;
  }

  resetMensagens() {
    this.message = '';
    this.isError = false;
    this.loading = false;
    this.showRegisterLink = false;
  }
}
