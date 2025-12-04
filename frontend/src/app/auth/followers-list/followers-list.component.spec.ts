import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowersListComponent } from './followers-list.component';

describe('FollowersList', () => {
  let component: FollowersListComponent;
  let fixture: ComponentFixture<FollowersListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FollowersListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FollowersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
