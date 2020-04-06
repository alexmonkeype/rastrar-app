import {Component, OnInit, OnDestroy} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {ApiService} from '../../services/api.service';
import {LoadingController, Platform, ToastController} from '@ionic/angular';
import {BarcodeScanner} from '@ionic-native/barcode-scanner/ngx';
import {TrackingService} from '../../services/tracking.service';

@Component({
    selector: 'app-tab1',
    templateUrl: 'tab1.page.html',
    styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit, OnDestroy {
    private trackingSub;

    records = [];
    trackingOn = false;
    userId = '';

    constructor(
        private authService: AuthService,
        private apiService: ApiService,
        private loadingController: LoadingController,
        private toastController: ToastController,
        private barcodeScanner: BarcodeScanner,
        private platform: Platform,
        private trackingService: TrackingService
    ) {
        const ref = this;
        this.platform.ready()
            .then(() => {
                ref.trackingSub = ref.trackingService.register
                    .subscribe(() => {
                        this.loadRecords();
                    });
                ref.trackingService.isActivated()
                    .then(activated => {
                        this.trackingOn = activated;
                        // this.buttonActionStatus();
                    });
            });
    }

    ngOnInit() {
        this.authService.getUserID()
            .then((userId: string) => {
                this.userId = userId;
                this.loadRecords();
            });
    }

    ngOnDestroy() {
    }

    refreshRecords() {
        this.loadRecords();
    }

    loadRecords() {
        // console.log('loadRecords');
        const ref = this;
        this.trackingService.getMatches(5)
            .then((values: any) => {
                console.log('values', values);
                ref.records.splice(0, ref.records.length);
                setTimeout(() => {
                    Array.prototype.push.apply(ref.records, values);
                }, 1000);
            })
            .catch(reason => {
                console.error('loadRecords reason', reason);
            });
    }

    renderRecord(record) {
        if (record.toUserID !== '') {
            return '<p><strong>Contacto con ' + this.getShortId(record.toUserID) + ' vía ' +
                record.type + '</strong></p>' +
                '<p>' + record.txTimestamp + '</p>';
        } else {
            return '<p><strong>Se guardo su posición.</strong><p/><p>' + record.txTimestamp + '</p>';
        }
    }

    iconRecord(record) {
        if (record.type === 'BT') {
            return 'bluetooth-outline';
        } else if (record.type === 'QR' || record.type === 'QR-L') {
            return 'qr-code-outline';
        }
        return 'locate-outline';
    }

    getShortId(userId: string) {
        let short = userId;
        if (userId && userId.length > 5) {
            short = userId.substr(0, 4) + '...' + userId.substr(userId.length - 4, 4);
        }
        return short;
    }
}
