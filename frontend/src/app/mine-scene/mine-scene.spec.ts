import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MineScene } from './mine-scene';

describe('MineScene', () => {
  let component: MineScene;
  let fixture: ComponentFixture<MineScene>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MineScene],
    }).compileComponents();

    fixture = TestBed.createComponent(MineScene);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
