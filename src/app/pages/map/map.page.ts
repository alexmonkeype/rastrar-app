import {Component, OnInit} from '@angular/core';
import {
    GoogleMaps,
    GoogleMap,
    GoogleMapOptions,
    Marker,
    LatLng
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
    private trackingSub;
    private trackingOn = false;

    colorTrackingButton = 'default';
    map: GoogleMap;
    lastMarker: Marker;

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
                this.trackingService.getMatchesLastHours(4)
                    .then(records => {
                        // console.log('showMarkers', 'start');
                        this.showMarkers(records);
                        // console.log('showMarkers', 'end');

                        this.trackingSub = this.trackingService.register
                            .subscribe(position => {
                                // console.log('trackingService', 'register');
                                this.addMarker(position.latitude, position.longitude);
                            });
                    });
            });
    }

    showMap(location) {
        const mapOptions: GoogleMapOptions = {
            controls: {
                compass: false,
                zoom: false,
                myLocation: true,
                myLocationButton: false,
                mapToolbar: false
            },
            camera: {
                target: {
                    lat: location.latitude,
                    lng: location.longitude
                },
                zoom: 18,
                tilt: 0
            }
        };

        this.map = GoogleMaps.create('map_canvas', mapOptions);
    }

    showMarkers(records) {
        // console.log('showMarkers', records);
        let icon = 'green';
        for (const record of records) {
            this.addMarker(record.userLat, record.userLong, icon);
            icon = 'red';
        }
    }

    addMarker(latitude, longitude, icon = 'red') {
        if (!this.map || !latitude || !longitude) {
            return;
        }

        let previousPosition = null;
        if (this.lastMarker) {
            previousPosition = this.lastMarker.getPosition();
            if (!this.lastMarker.get('first')) {
                this.lastMarker.remove();
                this.map.addMarkerSync({
                    icon: 'orange',
                    position: previousPosition
                });
            }
        }

        const marker: Marker = this.map.addMarkerSync({
            icon,
            position: {
                lat: latitude,
                lng: longitude
            },
            first: (icon === 'green')
        });

        if (previousPosition === null) {
            previousPosition = marker.getPosition();
        }

        this.map.addPolyline(
            {
                points: [previousPosition, marker.getPosition()],
                visible: true,
                color: '#E9505B',
                width: 4
            })
            .then((res) => {
                // this.previousPosition = pos;
            })
            .catch(reason => {
                console.error('addPolyline', reason);
            });

        this.lastMarker = marker;
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
            'Registrar mi rastro <b>automáticamente</b> por GPS. <i>Media precisión</i></p>' +
            '<p><ion-icon name="bluetooth-outline"></ion-icon>&nbsp;&nbsp;' +
            'Registrar mi rastro <b>automáticamente</b> por Bluetooth™. <i>Alta precisión</i>.</p>' +
            '<p><ion-icon name="qr-code-outline"></ion-icon>&nbsp;&nbsp;' +
            'Registrar mi rastro <b>manualmente</b> escaneando un QR. <i>Muy alta precisión</i>.</p>';

        const alert = await this.alertController.create({
            header: 'Herramientras para mi rastro',
            // subHeader: 'Subtitle',
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
