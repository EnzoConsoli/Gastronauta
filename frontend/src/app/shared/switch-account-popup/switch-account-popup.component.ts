import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-switch-account-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './switch-account-popup.component.html',
  styleUrls: ['./switch-account-popup.component.css']
})
export class SwitchAccountPopupComponent {

  isVisible = false;

  email = '';
  senha = '';

  emailRecuperacao = '';
  modo: 'login' | 'esqueci' = 'login';

  erroMensagem = '';

  mostrarSenha = false; // <<< ADICIONADO

  @Output() loginEvent = new EventEmitter<{ email: string, senha: string }>();
  @Output() closeEvent = new EventEmitter<void>();
  @Output() sucessoEsqueciSenha = new EventEmitter<void>();

  constructor(private authService: AuthService) {}

  show() {
    this.isVisible = true;
    this.email = '';
    this.senha = '';
    this.emailRecuperacao = '';
    this.erroMensagem = '';
    this.modo = 'login';
    this.mostrarSenha = false;
  }

  hide() {
    this.isVisible = false;
    this.closeEvent.emit();
  }

  toggleSenha() {
    this.mostrarSenha = !this.mostrarSenha; // <<< NOVO
  }

  login() {
    if (!this.email.trim() || !this.senha.trim()) {
      this.erroMensagem = "Preencha email e senha.";
      return;
    }

    this.erroMensagem = '';
    this.loginEvent.emit({ email: this.email, senha: this.senha });
  }

  abrirEsqueciSenha() {
    this.erroMensagem = '';
    this.emailRecuperacao = '';
    this.modo = 'esqueci';
  }

  enviarRecuperacao() {
    if (!this.emailRecuperacao.trim()) {
      this.erroMensagem = "Digite seu email.";
      return;
    }

    this.authService.forgotPassword(this.emailRecuperacao).subscribe({
      next: () => {
        this.sucessoEsqueciSenha.emit();
      },
      error: () => {
        this.erroMensagem = "Email não encontrado.";
      }
    });
  }
}
