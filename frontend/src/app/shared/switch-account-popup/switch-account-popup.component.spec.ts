import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SwitchAccountPopupComponent } from './switch-account-popup.component';

describe('SwitchAccountPopup', () => {
  let component: SwitchAccountPopupComponent;
  let fixture: ComponentFixture<SwitchAccountPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwitchAccountPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SwitchAccountPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
