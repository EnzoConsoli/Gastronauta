import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-rating-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rating-modal.html',
  styleUrls: ['./rating-modal.css']
})
export class RatingModalComponent {
  isVisible = false;

  currentRating = 0; // A nota que o usuário clicou
  hoverRating = 0;   // A nota que o usuário está passando o mouse por cima
  comentario = '';

  @Output() onPublish = new EventEmitter<{ nota: number, comentario: string }>();

  show(): void {
    this.isVisible = true;
    this.currentRating = 0;
    this.comentario = '';
  }

  hide(): void {
    this.isVisible = false;
  }

  setRating(nota: number): void {
    this.currentRating = nota;
  }

  publish(): void {
    this.onPublish.emit({ nota: this.currentRating, comentario: this.comentario });
    this.hide();
  }
}