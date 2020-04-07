import {Injectable} from '@angular/core';
import {
    BackgroundGeolocation,
    BackgroundGeolocationConfig,
    BackgroundGeolocationEvents,
    BackgroundGeolocationResponse
} from '@ionic-native/background-geolocation/ngx';
import {SQLiteService} from './sqlite.service';
import {DatePipe} from '@angular/common';
import {Platform} from '@ionic/angular';
import {BehaviorSubject} from 'rxjs';
import {BluetoothSerial} from '@ionic-native/bluetooth-serial/ngx';
import {BackgroundMode} from '@ionic-native/background-mode/ngx';
import {KEY_PREFIX, QR_PREFIX} from '../../environments/environment';
import {Storage} from '@ionic/storage';

export const ACTIVATED_KEY = KEY_PREFIX + 'activated';

@Injectable({
    providedIn: 'root'
})
export class TrackingService {

    private userID: string;
    private discoverableTime = 2 * 60; // time in seconds
    private bluetoothListTimeout = 3.7; // time in seconds
    private bluetoothIntRef = null;
    private subscription;
    private bluetoothSub;

    public register: BehaviorSubject<any> = new BehaviorSubject<any>([]);
    public firstTime = false;
    public migrating = false;

    constructor(
        private platform: Platform,
        private backgroundMode: BackgroundMode,
        private backgroundGeolocation: BackgroundGeolocation,
        private bluetoothSerial: BluetoothSerial,
        private storage: Storage,
        private sqliteService: SQLiteService
    ) {
        this.platform.ready()
            .then(() => {
                this.backgroundMode.setDefaults({
                    hidden: false,
                    silent: true
                });
                this.backgroundMode.on('activate')
                    .subscribe(() => {
                        // console.log('backgroundMode', 'activate');
                        if (!this.migrating) {
                            this.migrate()
                                .then();
                        }
                    });
                this.backgroundMode.on('deactivate')
                    .subscribe(() => {
                        // console.log('backgroundMode', 'deactivate');
                        if (!this.migrating) {
                            this.migrate()
                                .then();
                        }
                    });

                this.bluetoothSub = this.bluetoothSerial.setDeviceDiscoveredListener()
                    .subscribe(device => {
                        // console.log('setDeviceDiscoveredListener device', device);
                        this.checkBluetoothDevice(device.name);
                    });
            });
    }

    requestPermissions(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.getCurrentLocation({
                timeout: 1 * 1000,
                maximumAge: 60 * 1000,
                enableHighAccuracy: false
            })
                .catch(reason => {
                })
                .finally(() => {
                    if (this.platform.is('android')) {
                        this.bluetoothSerial.enable()
                            .catch(() => {
                            })
                            .finally(() => {
                                resolve();
                            });
                    } else {
                        resolve();
                    }
                });
        });
    }

    isActivated(): Promise<boolean> {
        return new Promise(resolve => {
            this.storage.get(ACTIVATED_KEY)
                .then(activated => {
                    resolve(activated);
                })
                .catch(reason => {
                    console.error('TrackingService isActivated', reason);
                    resolve(false);
                });
        });
    }

    private setActivated(activated: boolean): Promise<any> {
        return this.storage.set(ACTIVATED_KEY, activated);
    }

    getCurrentLocation(options?): Promise<any> {
        return new Promise((resolve, reject) => {
            this.backgroundGeolocation.getCurrentLocation(options)
                .then(value => {
                    resolve(value);
                })
                .catch(reason => {
                    reject(reason);
                });
        });
    }

    public setUserID(userID) {
        this.userID = userID;
    }

    private config() {
        const config: BackgroundGeolocationConfig = {
            saveBatteryOnBackground: true,
            startOnBoot: true,
            desiredAccuracy: 0,
            distanceFilter: 50,
            stationaryRadius: 50,
            interval: 10000,
            fastestInterval: 5000,
            activitiesInterval: 10000,
            maxLocations: 10000,
            debug: false, //  enable this hear sounds for background-geolocation life-cycle.
            stopOnTerminate: false, // enable this to clear background location settings when the app terminates
            notificationTitle: 'Rastrar está corriendo en segundo plano',
            notificationText: 'Tus rastro está siendo guardado.',
            notificationIconLarge: '@mipmap/ic_launcher',
            notificationIconSmall: '@mipmap/ic_launcher'
        };
        const ref = this;
        this.backgroundGeolocation.configure(config)
            .then(() => {

                if (ref.subscription) {
                    ref.subscription.unsubscribe();
                    ref.subscription = null;
                }

                this.subscription = ref.backgroundGeolocation.on(BackgroundGeolocationEvents.location)
                    .subscribe((location: BackgroundGeolocationResponse) => {
                        ref.registerPosition(location)
                            .then(() => {
                                ref.backgroundGeolocation.deleteLocation(location.id)
                                    .then();
                            });

                        // IMPORTANT:  You must execute the finish method here to inform the native plugin that you're finished,
                        // and the background-task may be completed.  You must do this regardless if your operations are successful or not.
                        // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
                        if (ref.platform.is('ios')) {
                            ref.backgroundGeolocation.finish()
                                .then(); // FOR IOS ONLY
                        }
                    });

            });
    }

    private migrate(): Promise<any> {
        // console.log('migrating...');
        this.migrating = true;
        return new Promise(resolve => {
            const ref = this;
            this.backgroundGeolocation.getLocations()
                .then(locations => {
                    // console.log('locations...', locations);
                    let count = 0;
                    const len = locations.length;
                    for (const location of locations) {
                        ref.registerPosition(location)
                            .finally(() => {
                                if (++count === len) {
                                    this.register.next(null);
                                }
                            });
                    }
                    this.backgroundGeolocation.deleteAllLocations()
                        .finally(() => {
                            this.migrating = false;
                            resolve();
                        });
                })
                .catch(reason => {
                    console.error('migrate', reason);
                    this.migrating = false;
                    resolve();
                });
        });
    }

    startTracking() {
        return new Promise((resolve, reject) => {
            this.setActivated(true)
                .then(() => {
                    this.starWatchBluetooth();
                    this.startBackgroundMode();
                    this.startWatchPosition()
                        .catch(reason => {
                            console.error('startTracking', reason);
                        })
                        .finally(() => {
                            resolve();
                        });
                })
                .catch(reason => reject(reason));
        });
    }

    stopTracking() {
        return new Promise((resolve, reject) => {
            this.setActivated(false)
                .then(() => {
                    this.stopWatchPosition();
                    this.stopWatchBluetooth();
                    this.stopBackgroundMode();
                    resolve();
                })
                .catch(reason => reject(reason));
        });
    }

    private startWatchPosition(): Promise<any> {
        // console.log('startWatchPosition');
        this.config();
        return this.backgroundGeolocation.start();
    }

    private stopWatchPosition() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.subscription = null;
        this.backgroundGeolocation.stop()
            .then();
    }

    registerCode(code): Promise<any> {
        if (code.indexOf('stampingID:') === 0) {
            const stampingID = code.replace('stampingID:', '');
            return this.getLocationPostData('QR', stampingID);
        } else if (code.indexOf('https://rastrar.com/?') === 0) {
            const stampingID = code.replace('https://rastrar.com/?', '');
            return this.getLocationPostData('QR-L', stampingID);
        } else if (code.indexOf(QR_PREFIX) === 0) {
            const stampingID = code.replace(QR_PREFIX, '');
            return this.getLocationPostData('BT', stampingID);
        } else {
            return Promise.reject('El código no le corresponde a un QR válido');
        }
    }

    private checkBluetoothDevice(deviceName) {
        if (deviceName.indexOf(QR_PREFIX) === 0) {
            this.registerCode(deviceName)
                .then();
        }
    }

    private getLocationPostData(type, aUserTo): Promise<any> {
        return new Promise((resolve, reject) => {
            this.getCurrentLocation()
                .then(resp => {
                    if (resp && resp) {
                        this.postData(type, resp.latitude, resp.longitude, aUserTo)
                            .then(value => {
                                resolve(value);
                                this.register.next({latitude: resp.latitude, longitude: resp.longitude});
                            })
                            .catch(reason => {
                                reject(reason);
                            });
                    } else {
                        reject('No se pudo obtener su ubicación');
                    }
                })
                .catch(reason => {
                    reject('No se pudo obtener su ubicación');
                });
        });
    }

    private postData(type, lat, lng, aUserTo): Promise<any> {
        const pipe = new DatePipe('en-US');
        const now = pipe.transform(Date.now(), 'yyyy-MM-ddTHH:mm:ss.SSS\'Z\'');

        return this.registerMatch(type, lat, lng, aUserTo, now);
    }

    private registerPosition(location): Promise<boolean> {
        // console.log('TrackingService', 'registerPosition', location);
        return new Promise((resolve, reject) => {
            if (location) {
                const lat = location.latitude;
                const lng = location.longitude;

                this.postData('GPS', lat, lng, '')
                    .then(() => {
                        this.register.next({latitude: lat, longitude: lng});
                        resolve();
                    })
                    .catch(reason => reject(reason));
            } else {
                reject('Location is not valid.');
            }
        });
    }

    registerMatch(type: string, lat: number, lng: number, toUserID: string, txTimestamp: string) {
        return this.sqliteService.registerMatch(type, lat, lng, this.userID, toUserID, txTimestamp);
    }

    getMatches(quantity: number) {
        return this.sqliteService.getMatches(quantity);
    }

    getMatchesLastHours(hours: number) {
        return this.sqliteService.getMatchesLastHours(hours);
    }

    getAllMatches() {
        return this.sqliteService.getAllMatches();
    }

    private starWatchBluetooth() {
        if (this.platform.is('android')) {
            // this.bluetoothSerial.setDiscoverable(this.discoverableTime);
            this.bluetoothSerial.setName(QR_PREFIX + this.userID);
            this.discoverUnpaired();
            this.bluetoothIntRef = setInterval(() => {
                this.discoverUnpaired();
            }, (this.discoverableTime + 5) * 1000);
        } else if (this.platform.is('ios')) {
            this.listDiscoveredDevices();
            /*this.bluetoothIntRef = setInterval(() => {
                this.listDiscoveredDevices();
            }, this.bluetoothListTimeout * 1000);*/
        }
    }

    private discoverUnpaired() {
        this.bluetoothSerial.discoverUnpaired()
            .then(value => {
                console.log('discoverUnpaired', value);
            })
            .catch(reason => {
                console.error('discoverUnpaired', reason);
                // this.showAlertMessage(reason).then();
            });
    }

    private listDiscoveredDevices() {
        this.bluetoothSerial.list()
            .then(list => {
                // console.log('list', list);
                if (list) {
                    for (const device of list) {
                        this.checkBluetoothDevice(device.name);
                    }
                }
            })
            .catch(reason => {
                console.error('list', reason);
            });
    }

    private stopWatchBluetooth() {
        if (this.bluetoothIntRef) {
            clearInterval(this.bluetoothIntRef);
            this.bluetoothIntRef = null;
        }
    }

    private startBackgroundMode() {
        this.backgroundMode
            .on('activate')
            .subscribe(() => {
                // console.log('backgroundMode on:', 'activate');
                this.backgroundMode.disableWebViewOptimizations();
            });
        this.backgroundMode.enable();
    }

    private stopBackgroundMode() {
        this.backgroundMode
            .un('activate', () => {
            });
        this.backgroundMode.disable();
    }

    clearOldMatches() {
        return this.sqliteService.clearOldMatches();
    }
}
