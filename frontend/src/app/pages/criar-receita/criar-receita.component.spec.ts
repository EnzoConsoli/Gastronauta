import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CriarReceitaComponent } from './criar-receita.component';

describe('CriarReceita', () => {
  let component: CriarReceitaComponent;
  let fixture: ComponentFixture<CriarReceitaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CriarReceitaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CriarReceitaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
