import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PreloadPage } from './preload.page';

describe('PreloadPage', () => {
  let component: PreloadPage;
  let fixture: ComponentFixture<PreloadPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PreloadPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(PreloadPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
