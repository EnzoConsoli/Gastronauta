import { Component } from '@angular/core';
import { RouterLink } from '@angular/router'; // <-- Precisa do RouterLink

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink], // <-- Adicione aqui
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent { }