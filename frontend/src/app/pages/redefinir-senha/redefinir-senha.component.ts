import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './redefinir-senha.component.html',
  styleUrls: ['./redefinir-senha.component.css']
})
export class RedefinirSenhaComponent {

  email = '';
  codigo = '';
  novaSenha = '';
  confirmarSenha = '';

  message = '';
  isError = false;
  loading = false;

  passwordFocused = false;
  passwordValidators = {
    minLength: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false
  };
  passwordStrengthPercent = 0;
  passwordStrengthColor = 'transparent';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onPasswordChange(password: string): void {
    const uppercaseRegex = /[A-Z]/;
    const numberRegex = /[0-9]/;
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;

    let strength = 0;

    this.passwordValidators.minLength = password.length >= 8;
    this.passwordValidators.hasUppercase = uppercaseRegex.test(password);
    this.passwordValidators.hasNumber = numberRegex.test(password);
    this.passwordValidators.hasSpecialChar = specialCharRegex.test(password);

    if (this.passwordValidators.minLength) strength++;
    if (this.passwordValidators.hasUppercase) strength++;
    if (this.passwordValidators.hasNumber) strength++;
    if (this.passwordValidators.hasSpecialChar) strength++;

    this.passwordStrengthPercent = (strength / 4) * 100;

    if (this.passwordStrengthPercent <= 25) {
      this.passwordStrengthColor = '#dc3545';
    } else if (this.passwordStrengthPercent <= 75) {
      this.passwordStrengthColor = '#ffc107';
    } else {
      this.passwordStrengthColor = '#28a745';
    }
  }

  onSubmit(form: NgForm): void {
    this.loading = true;
    this.isError = false;
    this.message = '';

    form.control.markAllAsTouched();

    if (form.invalid) {
      this.message = 'Por favor, preencha todos os campos obrigatórios.';
      this.isError = true;
      this.loading = false;
      return;
    }

    if (this.passwordStrengthPercent < 100) {
      this.message = 'Sua nova senha não atende aos requisitos.';
      this.isError = true;
      this.loading = false;
      return;
    }

    if (this.novaSenha !== this.confirmarSenha) {
      this.message = 'As senhas não coincidem.';
      this.isError = true;
      this.loading = false;
      return;
    }

    this.authService.resetPassword(
      this.email,
      this.codigo,
      this.novaSenha
    ).subscribe({
      next: (res) => {
        this.message = res.mensagem;
        this.isError = false;
        this.loading = false;

        setTimeout(() => this.router.navigate(['/login']), 2500);
      },
      error: (err) => {
        this.message = err.error.mensagem;
        this.isError = true;
        this.loading = false;
      }
    });
  }
}
