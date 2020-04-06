import {Component, OnDestroy, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';

declare function setQRCode(aId: any, aValue: any);

@Component({
    selector: 'app-tab2',
    templateUrl: 'tab2.page.html',
    styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit, OnDestroy {

    userId = '';

    constructor(
        private authService: AuthService
    ) {
    }

    ngOnInit() {
        this.authService.getUserID()
            .then((userId: string) => {
                console.log('ngOnInit userId', userId);
                this.userId = userId;
                // this.loadRecords();
                if (this.userId) {
                    this.generateQR();
                }
            });
    }

    ngOnDestroy() {
    }

    generateQR() {
        // const user = this.authService.getUser();
        // console.log('user', user);
        setQRCode('qr1', 'stampingID:' + this.userId);
    }
}
