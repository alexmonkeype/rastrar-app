import {Component, OnInit} from '@angular/core';
import {AuthService} from '../../services/auth.service';
import {AlertController, LoadingController, NavController} from '@ionic/angular';
import {SocialSharing} from '@ionic-native/social-sharing/ngx';
import {File, IWriteOptions} from '@ionic-native/file/ngx';
import {TrackingService} from '../../services/tracking.service';

@Component({
    selector: 'app-tab3',
    templateUrl: 'tab3.page.html',
    styleUrls: ['tab3.page.scss']
})
export class Tab3Page implements OnInit {
    // username = '';
    // email = '';
    userId = '';
    loading;
    dataDirectory;

    constructor(
        private navController: NavController,
        private socialSharing: SocialSharing,
        private loadingController: LoadingController,
        public alertController: AlertController,
        private file: File,
        private authService: AuthService,
        private trackingService: TrackingService
    ) {
        this.dataDirectory = this.file.dataDirectory;
    }

    ngOnInit() {
        this.authService.getUserID()
            .then((userId: string) => {
                this.userId = userId;
            });
    }

    onExport() {
        this.showLoading('Cargando datos...')
            .then(() => {
                const ref = this;
                this.trackingService.getAllMatches()
                    .then((matches: any) => {
                        this.generateGpxFile(matches)
                            .then(fileName => {
                                // console.log(path);
                                this.hideLoading();
                                this.socialSharing
                                    .shareViaEmail(
                                        'Se adjuntó archivo GPX.',
                                        'Mis datos de Rastrar',
                                        [],
                                        [],
                                        [],
                                        [this.dataDirectory + fileName]
                                    )
                                    .then(value => {
                                        console.log('value', value);
                                    })
                                    .catch(reason => {
                                        console.error('reason', reason);
                                    })
                                    .finally(() => {
                                        this.file.removeFile(this.dataDirectory, fileName)
                                            .then();
                                    });
                            });
                    })
                    .catch(reason => {
                        ref.hideLoading();
                        console.error('getMatches reason', reason);
                    });
            });
    }

    generateGpxFile(rows): Promise<string> {
        const ref = this;
        return new Promise((resolve, reject) => {
            let output = '<gpx xmlns="http://www.topografix.com/GPX/1/1" creator="monkey.pe" version="1.1" ' +
                'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
                'xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">';
            for (const row of rows) {
                const name = row.type + ': ' + row.toUserID;

                let src = '';
                if (row.type === 'GPS') {
                    src = 'Rastreo GPS';
                } else if (row.type === 'QR' || row.type === 'QR-L') {
                    src = 'Lector QR';
                } else if (row.type === 'BT') {
                    src = 'Bluetooth';
                }

                output += '<wpt lat="' + row.userLat + '" lon="' + row.userLong + '">' +
                    '<time>' + row.txTimestamp + '</time>' +
                    '<name>' + name + '</name>' +
                    '<src>' + src + '</src>' +
                    '<type>' + row.type + '</type>' +
                    '</wpt>';
            }
            output += '</gpx>';
            // console.log(path);

            const options: IWriteOptions = {
                append: false,
                replace: true
            };
            const fileName = 'data.gpx';
            this.file.writeFile(this.dataDirectory, fileName, output, options)
                .then(() => {
                    resolve(fileName);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    onUpload() {
    }

    onLogOut() {
        this.confirmLogOut()
            .then();
    }

    async confirmLogOut() {
        const alert = await this.alertController.create({
            header: 'Borrar mis rastros',
            message: '<p>Todos tus rastros serán eliminados de este dispositivo móvil para siempre y no podrán recuperarse.</p> ' +
                '<p>¿Estás seguro que deseas borrar todos tus rastros?</p>',
            buttons: [
                {
                    text: 'No borrar',
                    role: 'cancel',
                    cssClass: 'secondary',
                    handler: () => {
                    }
                }, {
                    text: 'Borrar',
                    handler: () => {
                        this.logout();
                    }
                }
            ]
        });

        await alert.present();
    }

    logout() {
        this.authService.logOut()
            .then(() => {
                this.trackingService.stopTracking()
                    .then();
                this.trackingService.setUserID(null);
                this.navController.navigateRoot('/home').then();
            });
    }

    shareWhatsApp() {
        // const user = this.authService.getUser();
        const url = 'https://rastrar.com/saludo/?' + this.userId;
        this.socialSharing.shareViaWhatsApp('', null, url)
            .then(() => {
            })
            .catch(reason => {
                console.error('shareWhatsApp reason', reason);
            });
    }

    async showLoading(msg): Promise<any> {
        // console.log('showLoading');
        this.loading = await this.loadingController.create({
            message: msg,
            // duration: 2000
        });
        await this.loading.present();
    }

    hideLoading() {
        // console.log('hideLoading');
        if (this.loading) {
            this.loading.dismiss().then();
        }
    }
}
