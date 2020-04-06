import {Injectable} from '@angular/core';
import {SQLite, SQLiteObject} from '@ionic-native/sqlite/ngx';
import {Storage} from '@ionic/storage';
import {Platform} from '@ionic/angular';
import {DatePipe} from '@angular/common';

export const PREFERENCE_KEY_DB_VERSION = 'PREFERENCE_KEY_DB_VERSION';
export const DB_VERSION = 1;
export const TRANS_TABLE_NAME = 'trans';

@Injectable({
    providedIn: 'root'
})
export class SQLiteService {
    private db: SQLiteObject = null;
    private ready = false;

    constructor(
        public sqlite: SQLite,
        private storage: Storage,
        private platform: Platform,
    ) {
    }

    init(): Promise<any> {
        return new Promise((resolve, reject) => {
            if (this.platform.is('mobile')) {
                this.createDatabase()
                    .then(() => {
                        this.checkDbVersion()
                            .then(() => {
                                this.ready = true;
                                resolve();
                            });
                    });
            } else {
                resolve();
            }
        });
    }

    private checkDbVersion(): Promise<any> {
        return new Promise(resolve => {
            this.storage.get(PREFERENCE_KEY_DB_VERSION)
                .then((version) => {
                    if (version !== DB_VERSION) {
                        this.storage.set(PREFERENCE_KEY_DB_VERSION, DB_VERSION)
                            .then(() => {
                                resolve();
                            });
                    } else {
                        resolve();
                    }
                });
        });
    }

    private createDatabase(): Promise<any> {
        return new Promise((resolve, reject) => {
            this.sqlite
                .create({
                    name: 'data.db',
                    location: 'default' // the location field is required
                })
                .then(db => {
                    console.log('SQLiteService', 'createDatabase success');

                    this.setDatabase(db);
                    this.createAllTables()
                        .then(() => {
                            resolve();
                        })
                        .catch(reason => {
                            reject(reason);
                        });
                })
                .catch(reason => {
                    console.error('SQLiteService', 'createDatabase', reason);
                    reject(reason);
                });
        });
    }

    private setDatabase(db: SQLiteObject) {
        if (this.db == null) {
            this.db = db;
        }
    }

    public onReady(): Promise<any> {
        return new Promise(resolve => {
            if (this.ready) {
                resolve();
            } else {
                const ref = setInterval(() => {
                    if (this.ready) {
                        clearInterval(ref);
                        resolve();
                    }
                }, 500);
            }
        });
    }

    private createAllTables() {
        return new Promise((resolve, reject) => {
            this.createMatchingTable()
                .then(() => {
                    this.createMatchingIndex()
                        .then(() => {
                            resolve();
                        })
                        .catch(reason => {
                            reject(reason);
                        });
                })
                .catch(reason => {
                    reject(reason);
                });
        });
    }

    private createMatchingTable(): Promise<any> {
        const sql = 'CREATE TABLE IF NOT EXISTS ' + TRANS_TABLE_NAME + ' (' +
            'type TEXT,' +
            'userLat TEXT,' +
            'userLong TEXT,' +
            'fromUserID TEXT, ' +
            'toUserID TEXT, ' +
            'txTimestamp TEXT, ' +
            'synced INTEGER DEFAULT 0' +
            ')';
        return this.db.executeSql(sql, []);
    }

    private createMatchingIndex(): Promise<any> {
        const sql = 'CREATE INDEX IF NOT EXISTS trans_index_1 ' +
            'ON ' + TRANS_TABLE_NAME + '(txTimestamp, synced)';
        return this.db.executeSql(sql, []);
    }

    public registerMatch(type: string, lat: number, long: number, fromUserID: string, toUserID: string, txTimestamp: string) {

        const sql = 'INSERT INTO ' + TRANS_TABLE_NAME + ' (' +
            'type, userLat, userLong, fromUserID, toUserID, txTimestamp) ' +
            'values (?, ?, ?, ?, ?, ?)';
        const params = [
            type,
            lat,
            long,
            fromUserID,
            toUserID,
            txTimestamp
        ];
        return this.db.executeSql(sql, params);
    }

    getMatchesLastHours(hours: number) {
        const pipe = new DatePipe('en-US');
        const now = pipe.transform(Date.now(), 'yyyy-MM-ddTHH:mm:ss.SSS\'Z\'');
        const ref = this;
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM ' + TRANS_TABLE_NAME + ' ' +
                'where date(txTimestamp) > date("' + now + '", "-' + hours + ' hours") ' +
                'order by txTimestamp asc;';
            ref.db.executeSql(sql, [])
                .then(response => {
                    const result = [];
                    for (let index = 0; index < response.rows.length; index++) {
                        result.push(response.rows.item(index));
                    }
                    resolve(result);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    getMatches(quantity: number) {
        const ref = this;
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM ' + TRANS_TABLE_NAME + ' ' +
                'order by txTimestamp desc limit ' + quantity;
            ref.db.executeSql(sql, [])
                .then(response => {
                    const result = [];
                    for (let index = 0; index < response.rows.length; index++) {
                        result.push(response.rows.item(index));
                    }
                    resolve(result);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    getAllMatches() {
        const ref = this;
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM ' + TRANS_TABLE_NAME + ' ' +
                'order by txTimestamp desc;';
            ref.db.executeSql(sql, [])
                .then(response => {
                    const result = [];
                    for (let index = 0; index < response.rows.length; index++) {
                        result.push(response.rows.item(index));
                    }
                    resolve(result);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }

    clearOldMatches() {
        const pipe = new DatePipe('en-US');
        const now = pipe.transform(Date.now(), 'yyyy-MM-ddTHH:mm:ss.SSS\'Z\'');
        const sql = 'DELETE FROM ' + TRANS_TABLE_NAME + ' ' +
            'where date(txTimestamp) < date("' + now + '", "-45 days");';
        return this.db.executeSql(sql, []);
    }

    truncateMatchingTable() {
        const sql = 'DELETE FROM ' + TRANS_TABLE_NAME + ';';
        return this.db.executeSql(sql, []);
    }
}
