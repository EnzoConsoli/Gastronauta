import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css']
})
export class PopupComponent {

  isVisible = false;
  title = '';
  message = '';
  isConfirmation = false;

  requiresInput = false; // apenas se quiser pedir senha
  inputValue: string = '';

  showPassword: boolean = false;

  @Output() confirmAction = new EventEmitter<string>();
  @Output() cancelAction = new EventEmitter<void>();

  show(title: string, message: string, isConfirmation: boolean = false, requiresInput: boolean = false): void {
    this.title = title;
    this.message = message;
    this.isConfirmation = isConfirmation;
    this.requiresInput = requiresInput;

    this.inputValue = '';
    this.showPassword = false;
    this.isVisible = true;
  }

  hide(): void {
    this.isVisible = false;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onConfirm(): void {
    this.hide();
    this.confirmAction.emit(this.inputValue);
  }

  onCancel(): void {
    this.hide();
    this.cancelAction.emit(); // 🔥 AGORA FUNCIONA
  }
}
