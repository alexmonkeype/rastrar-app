import {Component} from '@angular/core';

import {Platform, NavController} from '@ionic/angular';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';
import {AuthService} from './services/auth.service';
import {SQLiteService} from './services/sqlite.service';
import {TrackingService} from './services/tracking.service';
import {BackgroundMode} from '@ionic-native/background-mode/ngx';

@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss']
})
export class AppComponent {

    constructor(
        private platform: Platform,
        private splashScreen: SplashScreen,
        private statusBar: StatusBar,
        private navController: NavController,
        private authService: AuthService,
        private sqliteService: SQLiteService,
        private backgroundMode: BackgroundMode,
        private trackingService: TrackingService
    ) {
        this.initializeApp();
    }

    initializeApp() {
        // const ref = this;
        this.platform.ready().then(() => {
            if (this.platform.is('ios')) {
                this.statusBar.styleDefault();
            } else {
                this.statusBar.overlaysWebView(false);
                this.statusBar.styleLightContent();
            }

            this.sqliteService.init()
                .then(() => {
                    this.initSession();
                });
        });
    }

    initSession() {
        const ref = this;
        this.authService.getUserID()
            .then((userID) => {
                // console.log('userID', (userID ? 'Exists' : 'Not exists'));
                if (userID) {
                    ref.trackingService.setUserID(userID);
                    ref.requestPermissions();
                } else {
                    ref.splashScreen.hide();
                    ref.navController.navigateRoot('/home').then();
                }
            })
            .catch(() => {
                ref.splashScreen.hide();
            });
    }

    private requestPermissions() {
        const ref = this;
        this.trackingService.requestPermissions()
            .then(() => {
                ref.trackingService.isActivated()
                    .then(activated => {
                        if (activated) {
                            ref.trackingService.startTracking()
                                .then();
                        }
                    });
            })
            .catch(reason => {
                console.error('requestPermissions', reason);
            })
            .finally(() => {
                ref.splashScreen.hide();
                ref.trackingService.clearOldMatches()
                    .finally(() => {
                        ref.navController.navigateRoot('/dashboard').then();
                    });
            });
    }
}
