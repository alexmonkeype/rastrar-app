import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PreloadPageRoutingModule } from './preload-routing.module';

import { PreloadPage } from './preload.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PreloadPageRoutingModule
  ],
  declarations: [PreloadPage]
})
export class PreloadPageModule {}
