import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css']
})
export class PopupComponent {
  isVisible = false;
  title = '';
  message = '';

  // O @Output cria um "evento" que o componente pai pode ouvir
  @Output() confirmAction = new EventEmitter<void>();

  show(title: string, message: string): void {
    this.title = title;
    this.message = message;
    this.isVisible = true;
  }

  hide(): void {
    this.isVisible = false;
  }

  // Quando o botão "OK" é clicado
  onConfirm(): void {
    this.hide(); // Esconde o popup
    this.confirmAction.emit(); // Emite o sinal para o componente pai
  }
}