import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {RouteReuseStrategy} from '@angular/router';

import {IonicModule, IonicRouteStrategy} from '@ionic/angular';
import {SplashScreen} from '@ionic-native/splash-screen/ngx';
import {StatusBar} from '@ionic-native/status-bar/ngx';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';

import {HttpClientModule} from '@angular/common/http';
import {IonicStorageModule} from '@ionic/storage';
import {SocialSharing} from '@ionic-native/social-sharing/ngx';
import {BarcodeScanner} from '@ionic-native/barcode-scanner/ngx';
import {BluetoothSerial} from '@ionic-native/bluetooth-serial/ngx';
import {BackgroundMode} from '@ionic-native/background-mode/ngx';
import {SQLite} from '@ionic-native/sqlite/ngx';
import {File} from '@ionic-native/file/ngx';
import {BackgroundGeolocation} from '@ionic-native/background-geolocation/ngx';
import {Device} from '@ionic-native/device/ngx';
import {GoogleMaps} from '@ionic-native/google-maps';


@NgModule({
    declarations: [AppComponent],
    entryComponents: [],
    imports: [
        BrowserModule,
        IonicModule.forRoot(),
        AppRoutingModule,
        HttpClientModule,
        IonicStorageModule.forRoot()
    ],
    providers: [
        StatusBar,
        SplashScreen,
        BackgroundGeolocation,
        SocialSharing,
        BarcodeScanner,
        BluetoothSerial,
        BackgroundMode,
        SQLite,
        File,
        Device,
        GoogleMaps,
        {provide: RouteReuseStrategy, useClass: IonicRouteStrategy}
    ],
    bootstrap: [AppComponent]
})
export class AppModule {
}
