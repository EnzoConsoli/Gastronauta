import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LikedPostsComponent } from './liked-posts.component';

describe('LikedPosts', () => {
  let component: LikedPostsComponent;
  let fixture: ComponentFixture<LikedPostsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LikedPostsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LikedPostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
