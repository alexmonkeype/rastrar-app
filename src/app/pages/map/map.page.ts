import {Component, OnInit} from '@angular/core';
import {
    GoogleMaps,
    GoogleMap,
    GoogleMapOptions
} from '@ionic-native/google-maps';
import {TrackingService} from '../../services/tracking.service';
import {Platform, ToastController, AlertController} from '@ionic/angular';
import {BarcodeScanner} from '@ionic-native/barcode-scanner/ngx';

@Component({
    selector: 'app-map',
    templateUrl: './map.page.html',
    styleUrls: ['./map.page.scss'],
})
export class MapPage implements OnInit {
    private trackingOn = false;

    colorTrackingButton = 'default';
    map: GoogleMap;

    constructor(
        private platform: Platform,
        public toastController: ToastController,
        public alertController: AlertController,
        public barcodeScanner: BarcodeScanner,
        private trackingService: TrackingService
    ) {
        this.platform.ready()
            .then(() => {
                this.trackingService.isActivated()
                    .then(activated => {
                        this.trackingOn = activated;
                        if (this.map) {
                            this.map.setMyLocationEnabled(this.trackingOn);
                        }
                        this.buttonActionStatus();
                    });
                if (this.trackingService.firstTime) {
                    this.trackingService.firstTime = false;
                    this.showInfo().then();
                }
            });
    }

    ngOnInit() {
        this.trackingService.getCurrentLocation()
            .then(location => {
                this.showMap(location);
            });
    }

    showMap(location) {
        const mapOptions: GoogleMapOptions = {
            controls: {
                compass: false,
                zoom: false,
                myLocation: this.trackingOn,
                myLocationButton: false,
                mapToolbar: false
            },
            camera: {
                target: {
                    lat: location.latitude,
                    lng: location.longitude
                },
                zoom: 16,
                tilt: 0
            }
        };

        this.map = GoogleMaps.create('map_canvas', mapOptions);
    }

    onSwitchTracking() {
        this.trackingOn = !this.trackingOn;
        if (this.trackingOn) {
            this.trackingService.startTracking()
                .then();
        } else {
            this.trackingService.stopTracking()
                .then();
        }
        if (this.map) {
            this.map.setMyLocationEnabled(this.trackingOn);
        }
        this.buttonActionStatus();
    }

    buttonActionStatus() {
        this.colorTrackingButton = this.trackingOn ? 'primary' : 'default';
    }

    scannerQR() {
        this.barcodeScanner.scan({
            formats: 'QR_CODE',
            prompt: '',
            showFlipCameraButton: true,
            showTorchButton: true,
            resultDisplayDuration: 0
        }).then(barcodeData => {
            if (barcodeData.text.length > 0) {
                this.trackingService.registerCode(barcodeData.text)
                    .then(() => {
                        this.showAlertMessage('¡Listo!')
                            .then();
                    })
                    .catch(reason => {
                        this.showAlertMessage(reason)
                            .then();
                    });
            }
        }).catch(err => {
            console.error('Error', err);
        });
    }

    onShowInfo() {
        this.showInfo().then();
    }

    async showInfo() {
        const html = '<p><ion-icon name="location-outline"></ion-icon>&nbsp;&nbsp;' +
            'Se guarda mi ubicación <b>automáticamente</b> por GPS.</p>' +
            '<p><ion-icon name="bluetooth-outline"></ion-icon>&nbsp;&nbsp;' +
            'Se guarda mis cruces con otros usuarios <b>automáticamente</b> por Bluetooth™.</p>' +
            '<p><ion-icon name="qr-code-outline"></ion-icon>&nbsp;&nbsp;' +
            'Guardo mi rastro <b>manualmente</b> escaneando un QR.</p>';

        const alert = await this.alertController.create({
            header: '¿Cómo se guarda mi rastro?',
            message: html,
            buttons: ['OK'],
            cssClass: 'alert'
        });

        await alert.present();
    }

    async showAlertMessage(msg) {
        const toast = await this.toastController.create({
            message: msg,
            duration: 2000,
            color: 'primary'
        });
        toast.present();
    }
}
