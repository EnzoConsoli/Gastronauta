import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms'; // <-- Importe NgForm

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './redefinir-senha.component.html',
  styleUrls: ['./redefinir-senha.component.css']
})
export class RedefinirSenhaComponent implements OnInit {
  token: string | null = null;
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
    private route: ActivatedRoute,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
  }

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

  // 👇 LÓGICA ATUALIZADA AQUI 👇
  onSubmit(form: NgForm): void {
    this.loading = true;
    this.isError = false;
    this.message = '';

    form.control.markAllAsTouched();

    // 1. VERIFICAÇÃO DE CAMPOS VAZIOS
    if (form.invalid) {
      this.message = 'Por favor, preencha todos os campos obrigatórios.';
      this.isError = true;
      this.loading = false;
      return;
    }

    // 2. VERIFICAÇÃO DE FORÇA DA SENHA (seu código já tinha)
    if (this.passwordStrengthPercent < 100) {
      this.message = 'Sua nova senha não atende a todos os requisitos.';
      this.isError = true;
      this.loading = false;
      return;
    }

    // 3. VERIFICAÇÃO DE SENHAS IGUAIS (seu código já tinha)
    if (this.novaSenha !== this.confirmarSenha) {
      this.message = 'As senhas não coincidem.';
      this.isError = true;
      this.loading = false;
      return;
    }

    if (!this.token) {
      this.message = 'Token de redefinição inválido ou não encontrado.';
      this.isError = true;
      this.loading = false;
      return;
    }

    const data = { token: this.token, novaSenha: this.novaSenha };
    this.authService.resetPassword(data).subscribe({
      next: (res) => {
        this.message = res.mensagem;
        this.isError = false;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: (err) => {
        this.message = err.error.mensagem;
        this.isError = true;
        this.loading = false;
      }
    });
  }
}