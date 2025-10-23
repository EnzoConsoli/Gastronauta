import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common'; // Importe Location
import { RecipeService } from '../../services/recipe.service';
import { PopupComponent } from '../../shared/popup/popup.component';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-criar-receita',
  standalone: true,
  imports: [FormsModule, CommonModule, PopupComponent],
  templateUrl: './criar-receita.component.html',
  styleUrls: ['./criar-receita.component.css']
})
export class CriarReceitaComponent implements AfterViewInit {
  @ViewChild('recipePopup') popup!: PopupComponent;
  @ViewChild('fileInput') fileInputRef!: ElementRef<HTMLInputElement>;

  recipeData = {
    prato: '',
    descricao: '',
    dificuldade: 'Fácil',
    custo: 'Médio',
    tempo_preparo: '',
    rendimento: '',
    ingredientes: '',
    preparacao: '',
    cozimento: '',
  };
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  uploadError: string | null = null;
  isLoading = false;

  constructor(
    private recipeService: RecipeService,
    private router: Router,
    private location: Location
  ) { }

  ngAfterViewInit(): void {
    if (!this.popup) {
      console.error('ERRO CRÍTICO: PopupComponent não foi encontrado. Verifique #recipePopup no HTML.');
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) { this.uploadError = 'Tipo inválido.'; this.resetFileInput(); return; }
      if (file.size > 5 * 1024 * 1024) { this.uploadError = 'Máx 5MB.'; this.resetFileInput(); return; }
      this.selectedFile = file; this.uploadError = null;
      const reader = new FileReader();
      reader.onload = () => { this.imagePreview = reader.result; };
      reader.readAsDataURL(file);
    } else {
      this.resetFileInput();
    }
  }

  resetFileInput(): void {
    this.selectedFile = null; this.imagePreview = null;
    if (this.fileInputRef) { this.fileInputRef.nativeElement.value = ''; }
  }

  onSubmit(form: NgForm): void {
    if (form.invalid) {
      // Usa o popup para erros de validação
      if(this.popup) this.popup.show('Erro!', 'Preencha todos os campos obrigatórios (*).');
      else alert('Preencha todos os campos obrigatórios (*).');
      return;
    }
    
    this.isLoading = true;
    const formData = new FormData();
    Object.keys(this.recipeData).forEach(key => {
      formData.append(key, (this.recipeData as any)[key] || '');
    });
    if (this.selectedFile) {
      formData.append('imagemReceita', this.selectedFile, this.selectedFile.name);
    }

    this.recipeService.criar(formData).subscribe({
      next: (res) => {
        this.isLoading = false;
        if(this.popup) this.popup.show('Sucesso!', 'Sua receita foi publicada!');
        else alert('Sua receita foi publicada!');
        this.resetForm(form);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Erro ao criar receita (verifique o terminal do backend!):', err);
        const errorMsg = err.error?.mensagem || 'Não foi possível publicar sua receita.';
        if(this.popup) this.popup.show('Erro!', errorMsg);
        else alert(`Erro: ${errorMsg}`);
      }
    });
  }

  onPopupConfirm(): void {
    if (this.popup?.title.includes('Sucesso')) {
      this.router.navigate(['/dashboard']);
    }
  }

  resetForm(form: NgForm): void {
    form.resetForm({ dificuldade: 'Fácil', custo: 'Médio' });
    this.recipeData = {
      prato: '', descricao: '', dificuldade: 'Fácil', custo: 'Médio',
      tempo_preparo: '', rendimento: '', ingredientes: '', preparacao: '', cozimento: ''
    };
    this.resetFileInput();
  }

  voltar(): void { this.location.back(); }
}