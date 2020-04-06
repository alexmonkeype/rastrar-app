import {Injectable} from '@angular/core';
import {ApiService} from './api.service';
import {Storage} from '@ionic/storage';
import {BehaviorSubject} from 'rxjs';
import {KEY_PREFIX} from '../../environments/environment';
import {SQLiteService} from './sqlite.service';

export const USER_ID_KEY = KEY_PREFIX + 'userID';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private userID: string;

    public session: BehaviorSubject<any> = new BehaviorSubject<any>([]);

    constructor(
        private apiService: ApiService,
        private sqliteService: SQLiteService,
        private storage: Storage
    ) {
    }

    getUserID() {
        return new Promise((resolve, reject) => {
            this.storage.get(USER_ID_KEY)
                .then(userID => {
                    this.userID = userID;
                    // this.nonce = '';
                    this.apiService.setUserID(userID);
                    // this.sqliteService.setUserID(userID);
                    resolve(userID);
                })
                .catch(reason => {
                    reject(reason);
                });
        });
    }

    isLoggedIn() {
        return this.userID != null;
    }

    signUp(uuid): Promise<any> {
        return new Promise((resolve, reject) => {
            if (uuid && typeof uuid === 'string' && uuid.length > 0) {
                this.storage.set(USER_ID_KEY, uuid)
                    .then(() => {
                        // console.log('userID stored');
                        this.userID = uuid;
                        this.apiService.setUserID(uuid);
                        // this.sqliteService.setUserID(uuid);
                        resolve(uuid);
                    })
                    .catch(reason => {
                        console.error('Error storing userID', reason);
                        reject(reason);
                    });
            } else {
                reject('uuid is not valid.');
            }
        });
    }

    logOut(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.storage.remove(USER_ID_KEY)
                .then(() => {
                    this.userID = null;
                    this.apiService.setUserID(null);
                    this.sqliteService.truncateMatchingTable().then();
                    resolve();
                })
                .catch(reason => {
                    console.error('Error removing userID', reason);
                    reject(reason);
                });
        });
    }
}
