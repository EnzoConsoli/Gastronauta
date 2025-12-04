import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { PopupComponent } from '../../shared/popup/popup.component';

const BACKEND_URL = 'http://localhost:3000';
// <<< PLACEHOLDER ATUALIZADO CONFORME SEU PEDIDO >>>
const PLACEHOLDER_AVATAR = 'assets/canvo.png';

@Component({
  selector: 'app-editar-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, PopupComponent],
  templateUrl: './editar-perfil.component.html',
  styleUrls: ['./editar-perfil.component.css']
})
export class EditarPerfilComponent implements OnInit {
  @ViewChild('profilePopup') popup!: PopupComponent;

  profileData: any = {
    nome_usuario: '',
    nome_completo: '',
    bio: '',
    foto_perfil_url: null
  };
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = PLACEHOLDER_AVATAR;
  uploadError: string | null = null;
  isLoading = false;

  // <<< ADICIONADO: Para o popup saber o que fazer >>>
  private actionPending: 'save' | 'remove' | '' = '';

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.authService.getProfile().subscribe({
      next: (data: any) => { // <<< TIPO ADICIONADO
        this.profileData = data;
        if (data.foto_perfil_url) {
          this.imagePreview = `${BACKEND_URL}${data.foto_perfil_url}`; 
        } else {
          this.imagePreview = PLACEHOLDER_AVATAR; 
        }
        this.isLoading = false;
      },
      error: (err: any) => { // <<< TIPO ADICIONADO
        this.isLoading = false;
        if(this.popup) this.popup.show('Erro', 'Não foi possível carregar seu perfil.');
        else alert('Não foi possível carregar seu perfil.');
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) { 
        this.uploadError = 'Tipo de arquivo não suportado (use JPEG, PNG ou WEBP).';
        return; 
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB
        this.uploadError = 'Arquivo muito grande (máximo 2MB).';
        return; 
      }
      this.selectedFile = file;
      this.uploadError = null;
      const reader = new FileReader();
      reader.onload = () => { this.imagePreview = reader.result; };
      reader.readAsDataURL(file);
    }
  }

  // =======================================================
  // === FUNÇÃO "REMOVER FOTO" (AGORA CORRIGIDA) ===
  // =======================================================
  onRemovePicture(): void {
    if (!this.profileData.foto_perfil_url && !this.selectedFile) {
      return; // Se já não tem foto, não faz nada
    }
    
    // <<< CORREÇÃO: Chama o popup bonito em vez do confirm() feio >>>
    this.actionPending = 'remove'; // Avisa ao popup o que fazer
    this.popup.show(
      'Remover Foto', // Título
      'Tem certeza que deseja remover sua foto de perfil?', // Mensagem
      true // <<< O 'true' faz o botão "Cancelar" (Não) aparecer
    );
  }

  // =======================================================
  // === FUNÇÃO "SALVAR" (AGORA USA O POPUP) ===
  // =======================================================
  onSubmit(): void {
    this.isLoading = true;
    const formData = new FormData();
    formData.append('nome_completo', this.profileData.nome_completo || '');
    formData.append('bio', this.profileData.bio || '');

    if (this.selectedFile) {
      formData.append('fotoPerfil', this.selectedFile, this.selectedFile.name);
    } 
    else if (this.profileData.foto_perfil_url) {
      formData.append('foto_perfil_url_existente', this.profileData.foto_perfil_url);
    }

    this.authService.updateProfile(formData).subscribe({
      next: (res: any) => { // <<< TIPO ADICIONADO
        this.isLoading = false;

        // <<< CORREÇÃO: Chama o popup de "Sucesso" >>>
        this.actionPending = 'save'; // Avisa que foi um "salvar"
        this.popup.show('Sucesso!', 'Perfil atualizado!');
        
        // Atualiza o preview
        if (res.foto_perfil_url) {
          this.imagePreview = `${BACKEND_URL}${res.foto_perfil_url}`;
          this.profileData.foto_perfil_url = res.foto_perfil_url;
          this.selectedFile = null;
        } else if (!this.selectedFile) {
          this.imagePreview = PLACEHOLDER_AVATAR;
          this.profileData.foto_perfil_url = null;
        }
      },
      error: (err: any) => { // <<< TIPO ADICIONADO
        this.isLoading = false;
        this.popup.show('Erro!', err.error?.mensagem || 'Não foi possível atualizar o perfil.');
      }
    });
  }

  // =======================================================
  // === FUNÇÃO DO POPUP (AGORA "INTELIGENTE") ===
  // =======================================================
  onPopupConfirm(): void {
    if (this.actionPending === 'remove') {
      // Se a ação foi "remover", executa a lógica de remover
      this.isLoading = true;
      this.authService.removeProfilePicture().subscribe({
          next: () => {
            this.isLoading = false;
            this.imagePreview = PLACEHOLDER_AVATAR;
            this.selectedFile = null;
            this.profileData.foto_perfil_url = null;
            this.uploadError = null;
            // Mostra outro popup, de "Sucesso"
            this.popup.show('Sucesso', 'Foto de perfil removida.'); 
          },
          error: (err: any) => { // <<< TIPO ADICIONADO
            this.isLoading = false;
            if (this.popup) this.popup.show('Erro', err.error?.mensagem || 'Não foi possível remover a foto.');
          }
        });

    } else if (this.actionPending === 'save') {
      // Se a ação foi "salvar", navega para o dashboard
      this.router.navigate(['/dashboard']);
    }
    
    // Limpa a ação pendente
    this.actionPending = '';
  }

  onImageError(event: Event): void {
    const element = event.target as HTMLImageElement;
    const fallbackSrc = PLACEHOLDER_AVATAR; // <<< PLACEHOLDER ATUALIZADO
    if (element.src && !element.src.includes(fallbackSrc)) {
      element.src = fallbackSrc;
    }
  }
goBack() {
  window.history.back();
}

}


