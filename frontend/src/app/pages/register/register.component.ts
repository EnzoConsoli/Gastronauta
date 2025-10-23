import { Component, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { PopupComponent } from '../../shared/popup/popup.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PopupComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  @ViewChild('registrationPopup') popup!: PopupComponent;

  userData = {
    nome_usuario: '',
    email: '',
    senha: '',
    confirmarSenha: ''
  };

  showPassword = false;
  showConfirmPassword = false;
  errorMessage: string | null = null;

  // Variáveis para a força da senha
  passwordFocused = false;
  passwordValidators = {
    minLength: false,
    hasUppercase: false,
    hasNumber: false,
    hasSpecialChar: false
  };
  passwordStrengthPercent = 0;
  passwordStrengthColor = 'transparent';

  constructor(private authService: AuthService, private router: Router) { }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
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

  onSubmit(form: NgForm): void {
    this.errorMessage = null;
    form.control.markAllAsTouched();

    if (form.invalid) {
      this.errorMessage = 'Por favor, preencha todos os campos obrigatórios.';
      return;
    }
    
    // >>>>> NOVA VERIFICAÇÃO DE FORÇA DA SENHA <<<<<
    // Verifica se a senha atende a todos os 4 requisitos.
    if (this.passwordStrengthPercent < 100) {
      this.errorMessage = 'Sua senha não atende a todos os requisitos de segurança.';
      return;
    }

    if (this.userData.senha !== this.userData.confirmarSenha) {
      this.errorMessage = 'As senhas não coincidem!';
      return;
    }

    const dataToSend = {
      nome_usuario: this.userData.nome_usuario,
      email: this.userData.email,
      senha: this.userData.senha
    };

    this.authService.register(dataToSend).subscribe({
      next: (response) => {
        this.popup.show(
          'Cadastro Realizado!',
          'Sua conta foi criada com sucesso. Clique em OK para ir para a tela de login.'
        );
      },
      error: (err) => {
        this.errorMessage = err.error.mensagem;
      }
    });
  }

  onPopupConfirm(): void {
    this.router.navigate(['/login']);
  }
}