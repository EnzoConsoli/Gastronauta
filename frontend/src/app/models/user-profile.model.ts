export interface UserProfile {
  id: number;
  nome_usuario: string;
  nome_completo: string | null;
  bio: string | null;
  foto_perfil_url: string | null; // backend manda caminho relativo (ou null)
}
