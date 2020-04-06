import {Component, OnInit} from '@angular/core';
import {MenuController, NavController} from '@ionic/angular';
import {AuthService} from '../../services/auth.service';
import {Device} from '@ionic-native/device/ngx';
import {TrackingService} from '../../services/tracking.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {

    slideOpts = {
        pagination: {
            el: '.swiper-pagination',
            type: 'bullets',
        },
    };

    constructor(
        private menuController: MenuController,
        private navController: NavController,
        private device: Device,
        private authService: AuthService,
        private trackingService: TrackingService
    ) {
    }

    ngOnInit() {
    }

    ionViewDidEnter() {
        this.menuController.isEnabled()
            .then(isEnabled => {
                if (!isEnabled) {
                    this.menuController.enable(true)
                        .then(() => {
                            this.menuController.open().then();
                        });
                }
            });
    }

    start() {
        const ref = this;
        this.authService.signUp(this.device.uuid)
            .then((uuid) => {
                ref.trackingService.setUserID(uuid);
                ref.trackingService.requestPermissions()
                    .then(() => {
                        ref.trackingService.startTracking()
                            .then();
                    })
                    .catch(reason => {
                        console.error('requestPermissions', reason);
                    })
                    .finally(() => {
                        ref.trackingService.firstTime = true;
                        ref.navController.navigateRoot('/dashboard')
                            .then();
                    });
            })
            .catch(reason => {
                console.error('initSession', 'reason', reason);
            });
    }
}
