import {Component, OnInit} from '@angular/core';
import {MenuController} from '@ionic/angular';

@Component({
    selector: 'app-preload',
    templateUrl: './preload.page.html',
    styleUrls: ['./preload.page.scss'],
})
export class PreloadPage implements OnInit {

    constructor(
        private menuController: MenuController
    ) {
    }

    ngOnInit() {
    }

    ionViewDidEnter() {
        this.menuController.enable(false).then();
    }

}
